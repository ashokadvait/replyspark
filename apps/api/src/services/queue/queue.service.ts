import { ENV } from '../../config/env.js';

let replyPublicationQueue: any = null;
let draftGenerationQueue: any = null;
let initialized = false;

async function ensureQueues() {
  if (initialized) return;
  initialized = true;

  const isServerlessWithoutCloudRedis =
    (process.env.VERCEL || process.env.NODE_ENV === 'production') &&
    (!ENV.REDIS_URL || ENV.REDIS_URL.includes('localhost') || ENV.REDIS_URL.includes('127.0.0.1'));

  if (isServerlessWithoutCloudRedis) {
    return;
  }

  try {
    const [{ Queue }, { Redis }] = await Promise.all([
      import('bullmq'),
      import('ioredis')
    ]);

    const redisClient = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      }
    });

    redisClient.on('error', (err) => {
      console.warn(`[Redis Notice] ${err.message}`);
    });

    replyPublicationQueue = new Queue('reply-publication', { connection: redisClient as any });
    draftGenerationQueue = new Queue('review-generation', { connection: redisClient as any });
  } catch {
    console.warn('[Queue] Redis not available, running in direct processing mode.');
  }
}

export class QueueService {
  static async enqueueDraftGeneration(reviewId: string, organizationId: string): Promise<void> {
    await ensureQueues();
    if (draftGenerationQueue) {
      try {
        await draftGenerationQueue.add('generate-draft', { reviewId, organizationId }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 }
        });
        return;
      } catch {
        console.warn('[Queue] Could not enqueue to Redis, will process in-band if needed.');
      }
    }
  }

  static async enqueueReplyPublication(publicationJobId: string, organizationId: string): Promise<void> {
    await ensureQueues();
    if (replyPublicationQueue) {
      try {
        await replyPublicationQueue.add('publish-reply', { publicationJobId, organizationId }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        });
        return;
      } catch {
        console.warn('[Queue] Could not enqueue to Redis, fallback direct execution.');
      }
    }
  }
}
