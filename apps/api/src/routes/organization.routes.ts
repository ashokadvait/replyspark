import { FastifyInstance } from 'fastify';
import { prisma } from '@replyspark/db';
import { authenticate } from '../middleware/auth.js';
import { getGoogleBusinessProfileClient } from '../services/google/index.js';

export async function organizationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // List user organizations
  fastify.get('/', async (request, reply) => {
    const auth = request.auth!;
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: auth.userId, status: 'ACTIVE' },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                locations: true,
                reviews: true
              }
            }
          }
        }
      }
    });

    return reply.send({
      organizations: memberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
        locationsCount: m.organization._count.locations,
        reviewsCount: m.organization._count.reviews,
        isCurrent: m.organizationId === auth.organizationId
      }))
    });
  });

  // List locations for the current organization
  fastify.get('/locations', async (request, reply) => {
    const auth = request.auth!;
    let locations = await prisma.businessLocation.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        googleConnection: true,
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: { displayName: 'asc' }
    });

    // Auto-backfill missing address from Google Business Profile if any connected location has no address
    const missingAddressLocs = locations.filter(l => !l.address && l.googleConnection?.encryptedRefreshToken);
    if (missingAddressLocs.length > 0) {
      try {
        const conn = missingAddressLocs[0].googleConnection!;
        const accountName = missingAddressLocs[0].googleAccountResourceName;
        if (conn.encryptedRefreshToken && accountName) {
          const client = getGoogleBusinessProfileClient();
          const googleLocs = await client.getLocations(conn.encryptedRefreshToken, accountName);
          const addrMap = new Map(googleLocs.map(g => [g.locationName, g.address]));
          for (const loc of missingAddressLocs) {
            const fullAddr = addrMap.get(loc.googleLocationResourceName);
            if (fullAddr) {
              await prisma.businessLocation.update({
                where: { id: loc.id },
                data: { address: fullAddr }
              });
              loc.address = fullAddr;
            }
          }
        }
      } catch {
        // Ignore backfill errors and return existing location records
      }
    }

    return reply.send({
      locations: locations.map(l => ({
        id: l.id,
        displayName: l.displayName,
        address: l.address,
        timezone: l.timezone,
        connectionStatus: l.connectionStatus,
        lastSyncAt: l.lastSyncAt,
        reviewsCount: l._count.reviews
      }))
    });
  });

  // Create a new organization
  fastify.post('/', async (request, reply) => {
    const auth = request.auth!;
    const { name } = (request.body as { name?: string }) || {};

    if (!name || name.trim().length === 0) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Organization name is required'
      });
    }

    const org = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: name.trim()
        }
      });

      await tx.organizationMember.create({
        data: {
          organizationId: newOrg.id,
          userId: auth.userId,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      });

      // Seed standard initial preferences for the organization
      await tx.aiPreference.createMany({
        data: [
          {
            organizationId: newOrg.id,
            ruleText: 'Maintain a warm, genuine, and hospitality-first tone.',
            ruleCategory: 'TONE_STYLE',
            status: 'ACTIVE',
            createdBy: auth.userId,
            approvedBy: auth.userId
          },
          {
            organizationId: newOrg.id,
            ruleText: 'Never promise refunds or monetary compensation publicly.',
            ruleCategory: 'POLICY_SAFETY',
            status: 'ACTIVE',
            createdBy: auth.userId,
            approvedBy: auth.userId
          }
        ]
      });

      await tx.auditLog.create({
        data: {
          organizationId: newOrg.id,
          actorUserId: auth.userId,
          action: 'ORGANIZATION_CREATED',
          resourceType: 'ORGANIZATION',
          resourceId: newOrg.id,
          metadataJson: { name: newOrg.name }
        }
      });

      return newOrg;
    });

    return reply.code(201).send({
      organization: {
        id: org.id,
        name: org.name,
        role: 'OWNER'
      }
    });
  });
}

