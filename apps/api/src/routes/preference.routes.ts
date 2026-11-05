import { FastifyInstance } from 'fastify';
import { prisma, PreferenceStatus } from '@replyspark/db';
import { createPreferenceSchema, updatePreferenceSchema } from '@replyspark/shared';
import { authenticate } from '../middleware/auth.js';

export async function preferenceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // List all preferences for the organization (optionally filtered by locationId)
  fastify.get('/', async (request, reply) => {
    const auth = request.auth!;
    const { locationId } = (request.query as { locationId?: string }) || {};

    const preferences = await prisma.aiPreference.findMany({
      where: {
        organizationId: auth.organizationId,
        ...(locationId && locationId !== 'ALL'
          ? {
              OR: [
                { businessLocationId: null },
                { businessLocationId: locationId }
              ]
            }
          : {})
      },
      include: {
        businessLocation: {
          select: { id: true, displayName: true, address: true }
        },
        creator: {
          select: { id: true, displayName: true, email: true }
        }
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    });

    const activeRules = preferences.filter(
      p => p.status === PreferenceStatus.ACTIVE && p.ruleCategory !== 'LOCATION_TEMPLATE' && !p.templateName
    );
    const locationTemplates = preferences.filter(
      p => p.status === PreferenceStatus.ACTIVE && (p.ruleCategory === 'LOCATION_TEMPLATE' || Boolean(p.templateName))
    );
    const candidateRules = preferences.filter(p => p.status === PreferenceStatus.AWAITING_CONFIRMATION);
    const disabledRules = preferences.filter(p => p.status === PreferenceStatus.DISABLED);

    return reply.send({
      all: preferences,
      activeRules,
      locationTemplates,
      candidateRules,
      disabledRules
    });
  });

  // Get continuous learning feedback logs and prompt optimization stats
  fastify.get('/feedback-log', async (request, reply) => {
    const auth = request.auth!;
    const { locationId } = (request.query as { locationId?: string }) || {};

    const feedbacks = await prisma.reviewFeedback.findMany({
      where: {
        organizationId: auth.organizationId,
        ...(locationId && locationId !== 'ALL'
          ? {
              OR: [
                { businessLocationId: null },
                { businessLocationId: locationId }
              ]
            }
          : {})
      },
      include: {
        businessLocation: {
          select: { id: true, displayName: true, address: true }
        },
        replyDraft: {
          select: {
            id: true,
            generatedText: true,
            finalText: true,
            qualityStatus: true,
            modelName: true,
            review: {
              select: {
                id: true,
                rating: true,
                reviewerDisplayName: true,
                reviewText: true,
                reviewCreatedAt: true
              }
            }
          }
        },
        user: {
          select: { id: true, displayName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 60
    });

    const totalCount = feedbacks.length;
    const positiveCount = feedbacks.filter(f => (f.rating || 0) >= 4).length;
    const negativeCount = feedbacks.filter(f => (f.rating || 0) > 0 && (f.rating || 0) <= 2).length;
    const correctedCount = feedbacks.filter(f => Boolean(f.correctedText)).length;

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    for (const f of feedbacks) {
      categoryCounts[f.feedbackCategory] = (categoryCounts[f.feedbackCategory] || 0) + 1;
    }

    return reply.send({
      feedbacks,
      stats: {
        totalCount,
        positiveCount,
        negativeCount,
        correctedCount,
        categoryCounts,
        satisfactionRate: totalCount > 0 ? Math.round((positiveCount / (totalCount || 1)) * 100) : 100
      }
    });
  });

  // Manually add a preference rule or location template
  fastify.post('/', async (request, reply) => {
    const auth = request.auth!;
    const parseResult = createPreferenceSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({ error: 'Validation Error', details: parseResult.error.flatten() });
    }

    const { ruleText, ruleCategory, businessLocationId, templateName, targetRating } = parseResult.data;

    const preference = await prisma.aiPreference.create({
      data: {
        organizationId: auth.organizationId,
        businessLocationId: businessLocationId || null,
        templateName: templateName || null,
        targetRating: targetRating || 'ALL',
        ruleText,
        ruleCategory: ruleCategory || 'TONE_STYLE',
        status: PreferenceStatus.ACTIVE,
        createdBy: auth.userId,
        approvedBy: auth.userId
      },
      include: {
        businessLocation: {
          select: { id: true, displayName: true, address: true }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: ruleCategory === 'LOCATION_TEMPLATE' ? 'LOCATION_TEMPLATE_CREATED' : 'AI_PREFERENCE_CREATED',
        resourceType: 'AI_PREFERENCE',
        resourceId: preference.id,
        metadataJson: { ruleText, ruleCategory, templateName, businessLocationId }
      }
    });

    return reply.code(201).send({ success: true, preference });
  });

  // Approve / activate a candidate rule
  fastify.post('/:id/approve', async (request, reply) => {
    const auth = request.auth!;
    const { id } = request.params as { id: string };

    const preference = await prisma.aiPreference.findFirst({
      where: { id, organizationId: auth.organizationId }
    });

    if (!preference) {
      return reply.code(404).send({ error: 'Not Found', message: 'Preference not found' });
    }

    const updated = await prisma.aiPreference.update({
      where: { id: preference.id },
      data: {
        status: PreferenceStatus.ACTIVE,
        approvedBy: auth.userId,
        version: { increment: 1 }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: 'AI_PREFERENCE_ACTIVATED',
        resourceType: 'AI_PREFERENCE',
        resourceId: preference.id
      }
    });

    return reply.send({ success: true, preference: updated });
  });

  // Disable a preference rule
  fastify.post('/:id/disable', async (request, reply) => {
    const auth = request.auth!;
    const { id } = request.params as { id: string };

    const preference = await prisma.aiPreference.findFirst({
      where: { id, organizationId: auth.organizationId }
    });

    if (!preference) {
      return reply.code(404).send({ error: 'Not Found', message: 'Preference not found' });
    }

    const updated = await prisma.aiPreference.update({
      where: { id: preference.id },
      data: { status: PreferenceStatus.DISABLED }
    });

    return reply.send({ success: true, preference: updated });
  });

  // Delete a preference rule
  fastify.delete('/:id', async (request, reply) => {
    const auth = request.auth!;
    const { id } = request.params as { id: string };

    const preference = await prisma.aiPreference.findFirst({
      where: { id, organizationId: auth.organizationId }
    });

    if (!preference) {
      return reply.code(404).send({ error: 'Not Found', message: 'Preference not found' });
    }

    await prisma.aiPreference.delete({ where: { id: preference.id } });

    return reply.send({ success: true, message: 'Preference deleted' });
  });
}
