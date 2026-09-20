import type { components } from "./generated/api";

export type MovieDetail = components["schemas"]["MovieDetailDto"];

export type MovieSummary = Omit<
  MovieDetail,
  "genre_ids" | "origin_countries" | "firstReleaseDate" | "reReleaseDates"
>;

export type MovieSearchItem = components["schemas"]["MovieSearchItemDto"];

export type MovieSearchResponse =
  components["schemas"]["MovieSearchResponseDto"];

export type MovieChartItem = components["schemas"]["MovieChartItemDto"];

export type MovieChartResponse = components["schemas"]["MovieChartResponseDto"];

export type MovieChartStatsItem =
  components["schemas"]["MovieChartStatsItemDto"];

export type MovieChartStatsResponse =
  components["schemas"]["MovieChartStatsResponseDto"];

export type MovieChartHistoryItem =
  components["schemas"]["MovieChartHistoryItemDto"];

export type MovieChartHistoryResponse = MovieChartHistoryItem[];

export type UpcomingMovie = components["schemas"]["UpcomingMovieDto"];

export type UpcomingMoviesResponse =
  components["schemas"]["UpcomingMoviesResponseDto"];

export type CinemaResponse = components["schemas"]["CinemaResponseDto"];

export type LegalDongArea = components["schemas"]["LegalDongAreaResponseDto"];

export type RegionSyncResponse = components["schemas"]["RegionSyncResponseDto"];

export type RegionResponse = components["schemas"]["RegionResponseDto"];
