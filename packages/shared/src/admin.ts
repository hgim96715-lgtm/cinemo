export type AdminOverview = {
  userCount: number;
  todaySignupCount: number;
  todayLoginCount: number;
  todayVisitCount: number;
  weekSignupCount: number;
  weekLoginCount: number;
  weekVisitCount: number;
};

export type AdminAnalyticsPoint = {
  date: string;
  visits: number;
  logins: number;
  signups: number;
};
export type AdminHourlyPoint = {
  date: string;
  hour: number;
  visits: number;
  logins: number;
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
