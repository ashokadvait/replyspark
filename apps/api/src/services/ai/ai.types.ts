import { AIDraftResult, CandidatePreferenceExtraction, FeedbackLearningExample, PreferenceScope } from '@replyspark/shared';

export interface ActivePreferenceRule {
  id?: string;
  ruleText: string;
  ruleCategory: string;
  templateName?: string | null;
  targetRating?: string | null;
  businessLocationId?: string | null;
  locationName?: string | null;
  scope?: PreferenceScope;
}

export interface ExistingReplyExample {
  rating: number;
  reviewText?: string | null;
  reviewerDisplayName?: string | null;
  ownerReplyText: string;
}

export interface ReplyGenerationContext {
  rating: number;
  reviewText?: string | null;
  reviewerDisplayName?: string | null;
  businessName: string;
  locationName: string;
  address?: string | null;
  activePreferences: ActivePreferenceRule[];
  existingReplies?: ExistingReplyExample[];
  locationTemplates?: ActivePreferenceRule[];
  feedbackLearnings?: FeedbackLearningExample[];
}

export interface FeedbackContext {
  feedbackCategory: string;
  feedbackText?: string | null;
  originalGeneratedText: string;
  finalEditedText?: string | null;
  rating: number;
  businessName: string;
  locationName?: string | null;
}

export interface IAIProvider {
  generateReply(context: ReplyGenerationContext): Promise<AIDraftResult>;
  extractCandidatePreference(context: FeedbackContext): Promise<CandidatePreferenceExtraction | null>;
}
