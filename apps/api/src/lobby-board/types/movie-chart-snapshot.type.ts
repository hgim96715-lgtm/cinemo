export type MovieChartSnapshotInput = {
  kobisMovieCd: string;
  tmdbId?: number | null;
  rank: number;
  title: string;
  dailyAudienceCount: number;
  audienceCount: number;
};

export type MovieChartStatAccumulator = {
  kobisMovieCd: string;
  title: string;
  firstRank: number;
  lastRank: number;
  bestRank: number;
  firstAudienceCount: number;
  lastAudienceCount: number;
  dailyAudienceTotal: number;
  rankSampleCount: number;
};
