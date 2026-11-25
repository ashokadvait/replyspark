export interface GoogleAccountDto {
  name: string;
  accountName: string;
  type: string;
  role: string;
}

export interface GoogleLocationDto {
  name: string;
  locationName: string;
  title: string;
  address?: string;
  storeCode?: string;
  websiteUri?: string;
}

export interface SyncedReviewDto {
  googleReviewResourceName: string;
  rating: number;
  reviewText?: string;
  reviewerDisplayName?: string;
  reviewerPhotoUrl?: string;
  reviewCreatedAt: Date;
  googleUpdatedAt?: Date;
  ownerReplyText?: string;
  ownerReplyCommittedAt?: Date;
}

export interface PublishReplyResult {
  success: boolean;
  externalReplyResourceName?: string;
  publishedAt: Date;
  rawResponse?: any;
}

export interface FetchReviewsOptions {
  pageSize?: number;
  delayMs?: number;
  maxPages?: number;
  /**
   * Callback executed after each page of reviews is fetched from Google.
   * Return `false` to gracefully stop further pagination early (e.g. when encountering reviews already synced).
   */
  onPage?: (pageReviews: SyncedReviewDto[], pageIndex: number) => Promise<boolean | void>;
}

export interface IGoogleBusinessProfileClient {
  getAccounts(refreshToken: string): Promise<GoogleAccountDto[]>;
  getLocations(refreshToken: string, accountResourceName: string): Promise<GoogleLocationDto[]>;
  fetchReviews(
    refreshToken: string,
    locationResourceName: string,
    accountResourceName?: string,
    options?: FetchReviewsOptions
  ): Promise<SyncedReviewDto[]>;
  publishReply(
    refreshToken: string,
    locationResourceName: string,
    reviewResourceName: string,
    replyText: string
  ): Promise<PublishReplyResult>;
}
