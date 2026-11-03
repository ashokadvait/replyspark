import {
  AIDraftResult,
  CandidatePreferenceExtraction,
  FeedbackCategory,
  PreferenceScope,
  QualityStatus
} from '@replyspark/shared';
import { FeedbackContext, IAIProvider, ReplyGenerationContext } from './ai.types.js';

export class MockAIProvider implements IAIProvider {
  async generateReply(context: ReplyGenerationContext): Promise<AIDraftResult> {
    const { rating, reviewText, reviewerDisplayName, businessName, locationName, activePreferences } = context;
    const hasName = reviewerDisplayName && !reviewerDisplayName.toLowerCase().includes('anonymous');
    const textLower = (reviewText || '').trim().toLowerCase();
    const isAdvait = businessName.toLowerCase().includes('advait') || locationName.toLowerCase().includes('advait');
    const brandLabel = isAdvait ? 'Advait Labs' : locationName || businessName;

    // Step 6: Check for human review / escalation flags
    const hasSeriousIssue =
      textLower.includes('lawyer') ||
      textLower.includes('sue') ||
      textLower.includes('legal') ||
      textLower.includes('harass') ||
      textLower.includes('discriminat') ||
      textLower.includes('fraud') ||
      textLower.includes('scam') ||
      textLower.includes('salary') ||
      textLower.includes('unpaid') ||
      textLower.includes('refund') ||
      textLower.includes('privacy') ||
      textLower.includes('poison') ||
      textLower.includes('hospital');

    if (hasSeriousIssue) {
      return {
        replyText: `Thank you for bringing this to our attention. We take these concerns seriously and would appreciate the opportunity to review the details directly. Please reach out to our team privately so we can look into this matter.`,
        rationale: 'Review involves sensitive or serious allegations requiring human verification before publishing.',
        qualityStatus: QualityStatus.ESCALATED,
        qualityNotes: ['Requires human review: sensitive or serious allegation detected.'],
        suggestedEscalation: true,
        modelProvider: 'heuristic-rules-engine',
        modelName: 'advait-safety-guard-v2',
        promptVersion: 'v2.0-advait-optimized'
      };
    }

    let reviewerCategory = 'GENERAL';
    if (
      textLower.includes('work environment') ||
      textLower.includes('work culture') ||
      textLower.includes('learning') ||
      textLower.includes('intern') ||
      textLower.includes('trainee') ||
      textLower.includes('colleague') ||
      textLower.includes('workplace') ||
      textLower.includes('career')
    ) {
      reviewerCategory = 'EMPLOYEE';
    } else if (
      textLower.includes('interview') ||
      textLower.includes('recruitment') ||
      textLower.includes('hiring') ||
      textLower.includes('hr ') ||
      textLower.includes('candidate') ||
      textLower.includes('onboarding')
    ) {
      reviewerCategory = 'APPLICANT';
    } else if (
      textLower.includes('partner') ||
      textLower.includes('vendor') ||
      textLower.includes('collaborat') ||
      textLower.includes('inception') ||
      textLower.includes('vision')
    ) {
      reviewerCategory = 'PARTNER';
    } else if (
      textLower.includes('project') ||
      textLower.includes('service') ||
      textLower.includes('deliver') ||
      textLower.includes('client') ||
      textLower.includes('marketing') ||
      textLower.includes('report') ||
      textLower.includes('results') ||
      textLower.includes('smooth')
    ) {
      reviewerCategory = 'CLIENT';
    }

    let replyText = '';
    let qualityStatus = QualityStatus.PASSED;
    let rationale = `Classified as ${reviewerCategory} (${rating}★). Generated natural response aligned with ${brandLabel} voice and past replies.`;
    const qualityNotes: string[] = [`Category: ${reviewerCategory}`];

    if (!textLower) {
      // Rating-only reviews
      if (rating === 5) {
        replyText = hasName
          ? `Thank you for the five-star rating, ${reviewerDisplayName}! We appreciate your support.`
          : `Thank you for the five-star rating! We appreciate your support.`;
      } else if (rating === 4) {
        replyText = `Thank you for the four-star rating! We appreciate your support and always welcome any feedback.`;
      } else if (rating === 3) {
        replyText = `Thank you for your rating. We appreciate your feedback and would welcome any thoughts on how our team can improve your experience.`;
      } else {
        qualityStatus = QualityStatus.FLAGGED_WARNING;
        replyText = `Thank you for your feedback. We're sorry to see that your experience may not have met your expectations. We'd appreciate the opportunity to understand your concerns.`;
      }
    } else if (rating >= 4) {
      if (reviewerCategory === 'EMPLOYEE') {
        replyText = `Thank you for sharing your experience! It's great to hear that you've enjoyed the positive work environment and collaborative culture at ${brandLabel}. We truly appreciate the contributions of everyone on our team.`;
      } else if (reviewerCategory === 'APPLICANT') {
        replyText = `Thank you for taking the time to share your interview experience. We're pleased to hear that the process was smooth and well organised, and we appreciate your interest in ${brandLabel}.`;
      } else if (reviewerCategory === 'PARTNER') {
        replyText = `Thank you for your kind words and continued support! We truly appreciate your recognition of our team's vision and commitment to excellence at ${brandLabel}.`;
      } else if (reviewerCategory === 'CLIENT') {
        replyText = `Thank you for sharing your experience! We're glad our team could support you with smooth delivery and reliable service. We appreciate your trust in ${brandLabel} and look forward to working together again.`;
      } else {
        replyText = `Thank you for your kind words and positive feedback! Our team at ${brandLabel} truly appreciates your support.`;
      }
    } else if (rating === 3) {
      replyText = `Thank you for sharing your feedback. We appreciate your perspective and are always looking for ways our team at ${brandLabel} can improve. Please feel free to reach out directly if you'd like to share more details.`;
    } else {
      qualityStatus = QualityStatus.FLAGGED_WARNING;
      rationale = `Negative ${reviewerCategory} review (${rating}★). Acknowledged respectfully without defensiveness or unsupported promises.`;
      qualityNotes.push('Checked against policy: no public compensation promised; invited private communication.');
      replyText = `Thank you for sharing your feedback. We're sorry to hear that your experience did not meet expectations. We'd appreciate the opportunity to understand your concerns better—please reach out to our team directly so we can look into this.`;
    }

    const concisenessPref = activePreferences.find(p => p.ruleCategory === 'CONCISENESS');
    if (concisenessPref) {
      qualityNotes.push('Applied active rule: concise 25-60 word structure.');
    }

    return {
      replyText,
      rationale,
      qualityStatus,
      qualityNotes,
      suggestedEscalation: false,
      modelProvider: 'heuristic-ai',
      modelName: 'replyspark-advait-v2',
      promptVersion: 'v2.0-advait-optimized'
    };
  }

  async extractCandidatePreference(context: FeedbackContext): Promise<CandidatePreferenceExtraction | null> {
    const { feedbackCategory, feedbackText, finalEditedText, businessName } = context;

    if (feedbackCategory === FeedbackCategory.WRONG_TONE) {
      return {
        ruleText: `Adopt a more empathetic and conversational tone; avoid stiff or overly corporate phrases for ${businessName}.`,
        ruleCategory: 'TONE_STYLE',
        scope: PreferenceScope.ORGANIZATION,
        confidence: 0.88
      };
    }

    if (feedbackCategory === FeedbackCategory.TOO_LONG) {
      return {
        ruleText: 'Limit replies to maximum 2 sentences for high-efficiency guest responses.',
        ruleCategory: 'CONCISENESS',
        scope: PreferenceScope.ORGANIZATION,
        confidence: 0.92
      };
    }

    if (feedbackCategory === FeedbackCategory.UNSUPPORTED_PROMISE) {
      return {
        ruleText: 'Never promise refunds, discounts, or complimentary items in public review responses.',
        ruleCategory: 'POLICY_SAFETY',
        scope: PreferenceScope.ORGANIZATION,
        confidence: 0.95
      };
    }

    if (feedbackText && feedbackText.trim().length > 10) {
      return {
        ruleText: feedbackText.trim(),
        ruleCategory: 'CUSTOM_PREFERENCE',
        scope: PreferenceScope.ORGANIZATION,
        confidence: 0.85
      };
    }

    return null;
  }
}
