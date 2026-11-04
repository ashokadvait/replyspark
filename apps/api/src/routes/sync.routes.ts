import { FastifyInstance } from 'fastify';
import { prisma, WorkflowStatus, QualityStatus } from '@replyspark/db';
import { authenticate } from '../middleware/auth.js';
import { getGoogleBusinessProfileClient } from '../services/google/index.js';
import { getAIProvider } from '../services/ai/index.js';

export async function syncRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/', async (request, reply) => {
    const auth = request.auth!;
    const { locationId } = (request.body as { locationId?: string }) || {};

    const locations = await prisma.businessLocation.findMany({
      where: {
        organizationId: auth.organizationId,
        ...(locationId ? { id: locationId } : {})
      },
      include: {
        googleConnection: true,
        organization: true
      }
    });

    if (locations.length === 0) {
      return reply.code(400).send({ error: 'Bad Request', message: 'No connected locations to sync' });
    }

    const client = getGoogleBusinessProfileClient();
    const aiProvider = getAIProvider();

    // Fetch active preferences
    const preferences = await prisma.aiPreference.findMany({
      where: { organizationId: auth.organizationId, status: 'ACTIVE' }
    });

    let totalSynced = 0;
    let newDraftsGenerated = 0;

    for (const loc of locations) {
      const refreshToken = loc.googleConnection?.encryptedRefreshToken || 'mock-token';
      const fetched = await client.fetchReviews(
        refreshToken,
        loc.googleLocationResourceName,
        loc.googleAccountResourceName || undefined
      );

      // Pass 1: Sync all already-replied reviews first so we don't generate drafts for them
      // and so we can use their given replies as style examples for unreplied reviews.
      for (const rev of fetched) {
        if (!rev.ownerReplyText) continue;

        const existing = await prisma.review.findFirst({
          where: {
            businessLocationId: loc.id,
            googleReviewResourceName: rev.googleReviewResourceName
          }
        });

        if (!existing) {
          totalSynced++;
          await prisma.review.create({
            data: {
              organizationId: auth.organizationId,
              businessLocationId: loc.id,
              googleReviewResourceName: rev.googleReviewResourceName,
              rating: rev.rating,
              reviewText: rev.reviewText,
              reviewerDisplayName: rev.reviewerDisplayName,
              reviewerPhotoUrl: rev.reviewerPhotoUrl,
              reviewCreatedAt: rev.reviewCreatedAt,
              googleUpdatedAt: rev.googleUpdatedAt,
              ownerReplyText: rev.ownerReplyText,
              ownerReplyCommittedAt: rev.ownerReplyCommittedAt || rev.googleUpdatedAt || rev.reviewCreatedAt,
              workflowStatus: WorkflowStatus.PUBLISHED
            }
          });
        } else if (existing.ownerReplyText !== rev.ownerReplyText || existing.workflowStatus !== WorkflowStatus.PUBLISHED) {
          await prisma.review.update({
            where: { id: existing.id },
            data: {
              ownerReplyText: rev.ownerReplyText,
              ownerReplyCommittedAt: rev.ownerReplyCommittedAt || rev.googleUpdatedAt || existing.reviewCreatedAt,
              googleUpdatedAt: rev.googleUpdatedAt,
              workflowStatus: WorkflowStatus.PUBLISHED
            }
          });
          // Clean up any unnecessary unapproved drafts for reviews that already have a reply on Google
          await prisma.replyDraft.deleteMany({
            where: {
              reviewId: existing.id,
              approvals: { none: {} }
            }
          });
        }
      }

      // Gather existing given replies for this location/organization to learn how replies are given
      const repliedReviews = await prisma.review.findMany({
        where: {
          organizationId: auth.organizationId,
          ownerReplyText: { not: null }
        },
        orderBy: { reviewCreatedAt: 'desc' },
        take: 10
      });

      const existingReplies = repliedReviews
        .filter(r => Boolean(r.ownerReplyText))
        .map(r => ({
          rating: r.rating,
          reviewText: r.reviewText,
          reviewerDisplayName: r.reviewerDisplayName,
          ownerReplyText: r.ownerReplyText!
        }));

      // Pass 2: Sync unreplied reviews and generate AI drafts only for those without replies
      for (const rev of fetched) {
        if (rev.ownerReplyText) continue;

        const existing = await prisma.review.findFirst({
          where: {
            businessLocationId: loc.id,
            googleReviewResourceName: rev.googleReviewResourceName
          },
          include: { replyDrafts: true }
        });

        let targetReview = existing;

        if (!existing) {
          totalSynced++;
          targetReview = await prisma.review.create({
            data: {
              organizationId: auth.organizationId,
              businessLocationId: loc.id,
              googleReviewResourceName: rev.googleReviewResourceName,
              rating: rev.rating,
              reviewText: rev.reviewText,
              reviewerDisplayName: rev.reviewerDisplayName,
              reviewerPhotoUrl: rev.reviewerPhotoUrl,
              reviewCreatedAt: rev.reviewCreatedAt,
              googleUpdatedAt: rev.googleUpdatedAt,
              workflowStatus: WorkflowStatus.PENDING_APPROVAL
            },
            include: { replyDrafts: true }
          });
        }

        // Generate draft only if no reply has been given and no draft exists yet
        if (targetReview && !targetReview.ownerReplyText && targetReview.replyDrafts.length === 0) {
          try {
            const draftResult = await aiProvider.generateReply({
              rating: targetReview.rating,
              reviewText: targetReview.reviewText,
              reviewerDisplayName: targetReview.reviewerDisplayName,
              businessName: loc.organization.name,
              locationName: loc.displayName,
              address: loc.address,
              activePreferences: preferences.map(p => ({
                ruleText: p.ruleText,
                ruleCategory: p.ruleCategory
              })),
              existingReplies
            });

            await prisma.replyDraft.create({
              data: {
                organizationId: auth.organizationId,
                reviewId: targetReview.id,
                generatedText: draftResult.replyText,
                qualityStatus: draftResult.qualityStatus as QualityStatus,
                qualityNotes: draftResult.qualityNotes?.join('; ') || draftResult.rationale,
                suggestedEscalation: draftResult.suggestedEscalation,
                modelProvider: draftResult.modelProvider,
                modelName: draftResult.modelName,
                promptVersion: draftResult.promptVersion
              }
            });

            await prisma.review.update({
              where: { id: targetReview.id },
              data: { workflowStatus: WorkflowStatus.PENDING_APPROVAL }
            });

            newDraftsGenerated++;
          } catch (err: any) {
            fastify.log.warn(`[Sync] Failed to generate AI draft for review ${targetReview.id}: ${err?.message || err}`);
          }
        }
      }

      // Also ensure any unreplied reviews in DB for this location without drafts get drafts generated
      const remainingUnreplied = await prisma.review.findMany({
        where: {
          businessLocationId: loc.id,
          ownerReplyText: null,
          replyDrafts: { none: {} }
        }
      });

      for (const unrepliedReview of remainingUnreplied) {
        try {
          const draftResult = await aiProvider.generateReply({
            rating: unrepliedReview.rating,
            reviewText: unrepliedReview.reviewText,
            reviewerDisplayName: unrepliedReview.reviewerDisplayName,
            businessName: loc.organization.name,
            locationName: loc.displayName,
            address: loc.address,
            activePreferences: preferences.map(p => ({
              ruleText: p.ruleText,
              ruleCategory: p.ruleCategory
            })),
            existingReplies
          });

          await prisma.replyDraft.create({
            data: {
              organizationId: auth.organizationId,
              reviewId: unrepliedReview.id,
              generatedText: draftResult.replyText,
              qualityStatus: draftResult.qualityStatus as QualityStatus,
              qualityNotes: draftResult.qualityNotes?.join('; ') || draftResult.rationale,
              suggestedEscalation: draftResult.suggestedEscalation,
              modelProvider: draftResult.modelProvider,
              modelName: draftResult.modelName,
              promptVersion: draftResult.promptVersion
            }
          });

          await prisma.review.update({
            where: { id: unrepliedReview.id },
            data: { workflowStatus: WorkflowStatus.PENDING_APPROVAL }
          });

          newDraftsGenerated++;
        } catch (err: any) {
          fastify.log.warn(`[Sync] Failed to generate AI draft for unreplied review ${unrepliedReview.id}: ${err?.message || err}`);
        }
      }

      await prisma.businessLocation.update({
        where: { id: loc.id },
        data: { lastSyncAt: new Date() }
      });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: 'REVIEWS_SYNCED',
        resourceType: 'REVIEW',
        metadataJson: { totalSynced, newDraftsGenerated }
      }
    });

    return reply.send({
      success: true,
      totalSynced,
      newDraftsGenerated,
      message: `Successfully synchronized ${totalSynced} new reviews with AI draft proposals.`
    });
  });
}
