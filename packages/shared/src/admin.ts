import type { CafeTableSnapshot } from "./cafe";

export type AdminOverview = {
  userCount: number;
  todaySignupCount: number;
  todayLoginCount: number;
  todayVisitCount: number;
  todayAnonReviewCount: number;
  weekSignupCount: number;
  weekLoginCount: number;
  weekVisitCount: number;
  weekAnonReviewCount: number;
  reviewCount: number;
  todayTicketIssuedCount: number;
  cafeSeatedCount: number;
  tables: CafeTableSnapshot[];
};

export type AdminAnalyticsPoint = {
  date: string;
  visits: number;
  logins: number;
  signups: number;
  ticketsIssued: number;
  ticketsUsed: number;
  reviews: number;
  cafeMessages: number;
};
export type AdminHourlyPoint = {
  date: string;
  hour: number;
  visits: number;
  logins: number;
  cafeMessages: number;
};
export type AdminAnalytics = {
  from: string;
  to: string;
  series: AdminAnalyticsPoint[];
  hours: AdminHourlyPoint[];
};

export type AdminGuest = {
  id: string;
  nickname: string;
  createdAt: string;
  lastVisitedAt: string | null;
  lastLoggedAt: string | null;
};

export type AdminFeedKind = "visit" | "login";

export type AdminPeopleFeedItem = {
  kind: AdminFeedKind;
  nickname: string;
  at: string;
};

export type AdminPeople = {
  guests: AdminGuest[];
  todayVisitCount: number;
  todayLoginCount: number;
  feed: AdminPeopleFeedItem[];
  feedTotal: number;
};

export type AdminPeopleFeed = {
  items: AdminPeopleFeedItem[];
  total: number;
};

export type MoviePoolSeedRunStatus =
  | "running"
  | "succeeded"
  | "partial"
  | "failed";

export type MoviePoolSeedTrigger = "cron" | "manual";

export type MoviePoolSeedRun = {
  id: string;
  trigger: MoviePoolSeedTrigger;
  status: MoviePoolSeedRunStatus;
  pages: number;
  machineCount: number;
  processedPages: number;
  fetchedCount: number;
  savedCount: number;
  skippedCount: number;
  failedCount: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};
