import { FastifyInstance } from 'fastify';
import { prisma, WorkflowStatus, QualityStatus } from '@replyspark/db';
import { authenticate } from '../middleware/auth.js';
import { getGoogleBusinessProfileClient } from '../services/google/index.js';
import { getAIProvider } from '../services/ai/index.js';
import { QueueService } from '../services/queue/queue.service.js';

export async function syncRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/', async (request, reply) => {
    const auth = request.auth!;
    const { locationId, fullSync = false } = (request.body as { locationId?: string; fullSync?: boolean }) || {};

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

    // Fetch active AI preferences
    const preferences = await prisma.aiPreference.findMany({
      where: { organizationId: auth.organizationId, status: 'ACTIVE' }
    });

    let totalSynced = 0;
    let totalUpdated = 0;
    let newDraftsGenerated = 0;

    for (const loc of locations) {
      const refreshToken = loc.googleConnection?.encryptedRefreshToken || 'mock-token';
      const newlyCreatedUnreplied: { id: string; rating: number; reviewText: string | null; reviewerDisplayName: string | null; reviewCreatedAt: Date }[] = [];

      // 1. Fetch reviews using page streaming, 150ms delay between pages, and incremental early-exit
      await client.fetchReviews(
        refreshToken,
        loc.googleLocationResourceName,
        loc.googleAccountResourceName || undefined,
        {
          delayMs: 150, // Throttle to safely avoid Google 429 quota exhaustion
          pageSize: 50, // Google maximum
          onPage: async (pageReviews, pageIndex) => {
            if (pageReviews.length === 0) return false;

            // Batch query all existing reviews for this page in 1 single DB query
            const resourceNames = pageReviews.map(r => r.googleReviewResourceName);
            const existingList = await prisma.review.findMany({
              where: {
                businessLocationId: loc.id,
                googleReviewResourceName: { in: resourceNames }
              }
            });
            const existingMap = new Map(existingList.map(r => [r.googleReviewResourceName, r]));

            let pageHasChanges = false;

            for (const rev of pageReviews) {
              const existing = existingMap.get(rev.googleReviewResourceName);

              if (!existing) {
                // New review: insert immediately
                pageHasChanges = true;
                totalSynced++;

                const hasOwnerReply = Boolean(rev.ownerReplyText);
                const created = await prisma.review.create({
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
                    ownerReplyCommittedAt: rev.ownerReplyCommittedAt || (hasOwnerReply ? (rev.googleUpdatedAt || rev.reviewCreatedAt) : null),
                    workflowStatus: hasOwnerReply ? WorkflowStatus.PUBLISHED : WorkflowStatus.PENDING_APPROVAL
                  }
                });

                if (!hasOwnerReply) {
                  newlyCreatedUnreplied.push({
                    id: created.id,
                    rating: created.rating,
                    reviewText: created.reviewText,
                    reviewerDisplayName: created.reviewerDisplayName,
                    reviewCreatedAt: created.reviewCreatedAt
                  });
                }
              } else {
                // Check if Google has a newly added or updated reply
                const hasNewReply = rev.ownerReplyText && rev.ownerReplyText !== existing.ownerReplyText;
                const updateTimestampChanged = rev.googleUpdatedAt && (!existing.googleUpdatedAt || rev.googleUpdatedAt.getTime() !== existing.googleUpdatedAt.getTime());

                if (hasNewReply || updateTimestampChanged) {
                  pageHasChanges = true;
                  totalUpdated++;

                  await prisma.review.update({
                    where: { id: existing.id },
                    data: {
                      rating: rev.rating,
                      reviewText: rev.reviewText ?? existing.reviewText,
                      ownerReplyText: rev.ownerReplyText ?? existing.ownerReplyText,
                      ownerReplyCommittedAt: rev.ownerReplyCommittedAt || (rev.ownerReplyText ? (rev.googleUpdatedAt || existing.reviewCreatedAt) : existing.ownerReplyCommittedAt),
                      googleUpdatedAt: rev.googleUpdatedAt ?? existing.googleUpdatedAt,
                      workflowStatus: rev.ownerReplyText ? WorkflowStatus.PUBLISHED : existing.workflowStatus
                    }
                  });

                  if (rev.ownerReplyText) {
                    await prisma.replyDraft.deleteMany({
                      where: {
                        reviewId: existing.id,
                        approvals: { none: {} }
                      }
                    });
                  }
                }
              }
            }

            // Incremental optimization:
            // Unless the caller explicitly requested a fullSync, if every review on this page already
            // existed in the database and had no updates, we have reached already-synced history.
            // Returning false stops further Google API calls immediately!
            if (!fullSync && !pageHasChanges && pageIndex >= 1) {
              fastify.log.info(`[Sync] Page ${pageIndex} reviews are already up to date. Terminating pagination early.`);
              return false;
            }

            return true;
          }
        }
      );

      // 2. Gather existing replies as style context for AI drafts
      const repliedReviews = await prisma.review.findMany({
        where: {
          organizationId: auth.organizationId,
          ownerReplyText: { not: null }
        },
        orderBy: { reviewCreatedAt: 'desc' },
        take: 10
      });

      const existingReplies = repliedReviews.map(r => ({
        rating: r.rating,
        reviewText: r.reviewText,
        reviewerDisplayName: r.reviewerDisplayName,
        ownerReplyText: r.ownerReplyText!
      }));

      const locationTemplates = preferences
        .filter(p => (p.ruleCategory === 'LOCATION_TEMPLATE' || Boolean(p.templateName)) && (!p.businessLocationId || p.businessLocationId === loc.id))
        .map(p => ({
          id: p.id,
          ruleText: p.ruleText,
          ruleCategory: p.ruleCategory,
          templateName: p.templateName,
          targetRating: p.targetRating,
          businessLocationId: p.businessLocationId,
          locationName: loc.displayName
        }));

      const activePreferences = preferences
        .filter(p => p.ruleCategory !== 'LOCATION_TEMPLATE' && !p.templateName && (!p.businessLocationId || p.businessLocationId === loc.id))
        .map(p => ({
          ruleText: p.ruleText,
          ruleCategory: p.ruleCategory
        }));

      // 3. Decouple AI generation:
      // Only generate drafts in-band for the most recent unreplied reviews (max 5, within last 60 days)
      // to keep response latency fast and prevent timeouts or rate limit exhaustion.
      const now = Date.now();
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

      const immediateCandidates = newlyCreatedUnreplied
        .filter(r => r.reviewCreatedAt >= sixtyDaysAgo)
        .slice(0, 5);

      const immediateIds = new Set(immediateCandidates.map(r => r.id));
      const remainingCandidates = newlyCreatedUnreplied.filter(r => !immediateIds.has(r.id));

      for (const rev of immediateCandidates) {
        try {
          const draftResult = await aiProvider.generateReply({
            rating: rev.rating,
            reviewText: rev.reviewText,
            reviewerDisplayName: rev.reviewerDisplayName,
            businessName: loc.organization.name,
            locationName: loc.displayName,
            address: loc.address,
            activePreferences,
            locationTemplates,
            existingReplies
          });

          await prisma.replyDraft.create({
            data: {
              organizationId: auth.organizationId,
              reviewId: rev.id,
              generatedText: draftResult.replyText,
              qualityStatus: draftResult.qualityStatus as QualityStatus,
              qualityNotes: draftResult.qualityNotes?.join('; ') || draftResult.rationale,
              suggestedEscalation: draftResult.suggestedEscalation,
              modelProvider: draftResult.modelProvider,
              modelName: draftResult.modelName,
              promptVersion: draftResult.promptVersion
            }
          });

          newDraftsGenerated++;
        } catch (err: any) {
          fastify.log.warn(`[Sync] In-band draft generation failed for review ${rev.id}: ${err?.message || err}`);
        }
      }

      // Enqueue remaining unreplied reviews to background queue if available
      for (const rev of remainingCandidates) {
        await QueueService.enqueueDraftGeneration(rev.id, auth.organizationId);
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
        metadataJson: { totalSynced, totalUpdated, newDraftsGenerated }
      }
    });

    return reply.send({
      success: true,
      totalSynced,
      totalUpdated,
      newDraftsGenerated,
      message: `Synchronized ${totalSynced} new reviews and updated ${totalUpdated}. Generated ${newDraftsGenerated} AI drafts.`
    });
  });
}
