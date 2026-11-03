import { prisma, WorkflowStatus, QualityStatus, PreferenceStatus } from '@replyspark/db';
import { LiveGoogleBusinessProfileClient } from '../apps/api/src/services/google/live.google.client.js';
import { getAIProvider } from '../apps/api/src/services/ai/index.js';

async function run() {
  const org = await prisma.organization.findFirst({
    where: { id: 'a3969431-d6cc-449d-8ecf-dd6689b0b20d' },
    include: {
      locations: { include: { googleConnection: true } },
      members: true
    }
  });
  if (!org) throw new Error('Org not found');

  const userId = org.members[0]?.userId;
  const client = new LiveGoogleBusinessProfileClient();
  const aiProvider = getAIProvider();

  await prisma.promptVersion.create({
    data: {
      organizationId: org.id,
      version: 'v2.0-advait-optimized',
      status: 'ACTIVE',
      createdBy: userId,
      configurationJson: {
        role: 'Advait Labs GBP Review Response Assistant',
        categories: ['CLIENT', 'EMPLOYEE', 'APPLICANT', 'PARTNER', 'GENERAL'],
        styleLearning: 'Learns from existing ownerReplyText on replied reviews',
        wordCountRange: '20-55 words for written reviews, 8-20 words for rating-only reviews'
      }
    }
  });

  const existingPrefs = await prisma.aiPreference.count({ where: { organizationId: org.id } });
  if (existingPrefs === 0 && userId) {
    await prisma.aiPreference.createMany({
      data: [
        {
          organizationId: org.id,
          ruleCategory: 'TONE_STYLE',
          ruleText:
            'Classify reviewer as Client, Employee, Job Applicant, Business Partner, or General before replying; use "we" and "our team" in natural, human-written English without robotic clichés, emojis, or hashtags.',
          status: PreferenceStatus.ACTIVE,
          createdBy: userId,
          approvedBy: userId
        },
        {
          organizationId: org.id,
          ruleCategory: 'CONCISENESS',
          ruleText:
            'Keep written review replies between 20 and 55 words, and rating-only replies short and warm (8-20 words), matching the style of our previous given replies.',
          status: PreferenceStatus.ACTIVE,
          createdBy: userId,
          approvedBy: userId
        },
        {
          organizationId: org.id,
          ruleCategory: 'POLICY_SAFETY',
          ruleText:
            'Never invent services, projects, or employment relationships; never promise refunds, compensation, or employment publicly.',
          status: PreferenceStatus.ACTIVE,
          createdBy: userId,
          approvedBy: userId
        },
        {
          organizationId: org.id,
          ruleCategory: 'ESCALATION',
          ruleText:
            'Escalate for human approval if a review involves serious client complaints, employee misconduct, salary disputes, harassment, discrimination, legal threats, or security/privacy issues.',
          status: PreferenceStatus.ACTIVE,
          createdBy: userId,
          approvedBy: userId
        }
      ]
    });
  }

  const preferences = await prisma.aiPreference.findMany({
    where: { organizationId: org.id, status: PreferenceStatus.ACTIVE }
  });

  for (const loc of org.locations) {
    const refreshToken = loc.googleConnection?.encryptedRefreshToken;
    if (!refreshToken) continue;

    const fetched = await client.fetchReviews(
      refreshToken,
      loc.googleLocationResourceName,
      loc.googleAccountResourceName || undefined
    );

    console.log(`\n=== Location: ${loc.displayName} (${loc.googleLocationResourceName}) — Fetched ${fetched.length} reviews ===`);

    // Pass 1: Update already-replied reviews and remove unnecessary drafts
    for (const rev of fetched) {
      if (!rev.ownerReplyText) continue;

      const existing = await prisma.review.findFirst({
        where: {
          businessLocationId: loc.id,
          googleReviewResourceName: rev.googleReviewResourceName
        }
      });

      if (existing) {
        await prisma.review.update({
          where: { id: existing.id },
          data: {
            ownerReplyText: rev.ownerReplyText,
            ownerReplyCommittedAt: rev.ownerReplyCommittedAt || rev.googleUpdatedAt || existing.reviewCreatedAt,
            googleUpdatedAt: rev.googleUpdatedAt,
            workflowStatus: WorkflowStatus.PUBLISHED
          }
        });
        await prisma.replyDraft.deleteMany({
          where: { reviewId: existing.id }
        });
      }
    }

    // Gather existing given replies for style learning
    const repliedReviews = await prisma.review.findMany({
      where: {
        organizationId: org.id,
        ownerReplyText: { not: null }
      },
      orderBy: { reviewCreatedAt: 'desc' }
    });

    const existingReplies = repliedReviews.map((r) => ({
      rating: r.rating,
      reviewText: r.reviewText,
      reviewerDisplayName: r.reviewerDisplayName,
      ownerReplyText: r.ownerReplyText!
    }));

    // Pass 2: For unreplied reviews, regenerate fresh draft with the new Advait prompt + style learning
    for (const rev of fetched) {
      if (rev.ownerReplyText) continue;

      const existing = await prisma.review.findFirst({
        where: {
          businessLocationId: loc.id,
          googleReviewResourceName: rev.googleReviewResourceName
        }
      });

      if (existing) {
        await prisma.replyDraft.deleteMany({
          where: { reviewId: existing.id }
        });

        const draftResult = await aiProvider.generateReply({
          rating: existing.rating,
          reviewText: existing.reviewText,
          reviewerDisplayName: existing.reviewerDisplayName,
          businessName: org.name,
          locationName: loc.displayName,
          address: loc.address,
          activePreferences: preferences.map((p) => ({
            ruleText: p.ruleText,
            ruleCategory: p.ruleCategory
          })),
          existingReplies
        });

        const draft = await prisma.replyDraft.create({
          data: {
            organizationId: org.id,
            reviewId: existing.id,
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
          where: { id: existing.id },
          data: { workflowStatus: WorkflowStatus.PENDING_APPROVAL }
        });

        console.log('Generated new draft for unreplied review:', existing.reviewerDisplayName, '->', draft.generatedText, `[${draft.modelName}]`);
      }
    }
  }

  const finalReviews = await prisma.review.findMany({
    where: { organizationId: org.id },
    include: { replyDrafts: true, businessLocation: true },
    orderBy: { reviewCreatedAt: 'desc' }
  });

  console.log('\n=== FINAL ADVAIT TECHNOLOGY LABS REVIEWS SUMMARY ===');
  for (const r of finalReviews) {
    console.log({
      reviewer: r.reviewerDisplayName,
      rating: r.rating,
      date: r.reviewCreatedAt.toISOString().split('T')[0],
      reviewText: r.reviewText || '(Rating-only)',
      status: r.workflowStatus,
      alreadyGivenReply: r.ownerReplyText || null,
      generatedDraft: r.replyDrafts[0]?.generatedText || null,
      modelUsed: r.replyDrafts[0]?.modelName || null,
      qualityNotes: r.replyDrafts[0]?.qualityNotes || null
    });
  }
}

run().finally(() => prisma.$disconnect());

