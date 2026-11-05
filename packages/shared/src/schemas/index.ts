import { z } from 'zod';
import { FeedbackCategory, PreferenceScope, WorkflowStatus } from '../types/index.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required')
});

export const reviewQuerySchema = z.object({
  locationId: z.string().optional(),
  status: z.nativeEnum(WorkflowStatus).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const updateDraftSchema = z.object({
  replyText: z.string().min(1, 'Reply text cannot be empty')
});

export const approveDraftSchema = z.object({
  replyText: z.string().min(1, 'Approved text cannot be empty'),
  autoPublish: z.boolean().default(true)
});

export const rejectDraftSchema = z.object({
  reason: z.string().optional(),
  feedbackCategory: z.nativeEnum(FeedbackCategory).optional()
});

export const feedbackSchema = z.object({
  draftId: z.string().uuid(),
  category: z.nativeEnum(FeedbackCategory).default(FeedbackCategory.OTHER),
  feedbackText: z.string().optional().nullable(),
  correctedText: z.string().optional().nullable(),
  scope: z.nativeEnum(PreferenceScope).default(PreferenceScope.ORGANIZATION),
  teachAI: z.boolean().default(false),
  rating: z.number().min(1).max(5).optional().nullable(),
  businessLocationId: z.string().uuid().optional().nullable()
});

export const quickRateSchema = z.object({
  draftId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  category: z.nativeEnum(FeedbackCategory).optional().default(FeedbackCategory.OTHER),
  feedbackText: z.string().optional().nullable()
});

export const createPreferenceSchema = z.object({
  businessLocationId: z.string().uuid().optional().nullable(),
  templateName: z.string().optional().nullable(),
  targetRating: z.string().optional().default('ALL'),
  ruleText: z.string().min(3, 'Rule or template text must be at least 3 characters'),
  ruleCategory: z.string().default('TONE_STYLE'),
  scope: z.nativeEnum(PreferenceScope).default(PreferenceScope.ORGANIZATION)
});

export const updatePreferenceSchema = z.object({
  ruleText: z.string().min(3).optional(),
  templateName: z.string().optional().nullable(),
  targetRating: z.string().optional(),
  ruleCategory: z.string().optional(),
  businessLocationId: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'DISABLED', 'REJECTED']).optional()
});

export const connectLocationSchema = z.object({
  googleConnectionId: z.string().uuid(),
  locations: z.array(z.object({
    googleAccountResourceName: z.string(),
    googleLocationResourceName: z.string(),
    displayName: z.string(),
    address: z.string().optional(),
    timezone: z.string().default('UTC')
  })).min(1, 'Select at least one location to connect')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type ApproveDraftInput = z.infer<typeof approveDraftSchema>;
export type RejectDraftInput = z.infer<typeof rejectDraftSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type QuickRateInput = z.infer<typeof quickRateSchema>;
export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;
export type ConnectLocationInput = z.infer<typeof connectLocationSchema>;
