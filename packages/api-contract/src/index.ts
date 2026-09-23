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

export type CinemaPageResponse = components["schemas"]["CinemaPageResponseDto"];

export type PlaceSearchResult = components["schemas"]["PlaceSearchResultDto"];

export type CinemaAnalysisResponse =
  components["schemas"]["CinemaAnalysisResponseDto"];

export type PublicProfileResponse =
  components["schemas"]["PublicProfileResponseDto"];

export type UserMovieListItem = components["schemas"]["UserMovieListItemDto"];

export type UserMovieListPage =
  components["schemas"]["UserMovieListResponseDto"];

export type ToggleUserMovieResult =
  components["schemas"]["ToggleUserMovieResponseDto"];

export type UserMovieMarks = components["schemas"]["UserMovieMarksResponseDto"];

export type UserMovieCounts =
  components["schemas"]["UserMovieCountsResponseDto"];

export type UserMovieStats = components["schemas"]["UserMovieStatsResponseDto"];

export type UpdateDisplayDto = components["schemas"]["UpdateDisplayDto"];

export type UserMovieDisplayResult =
  components["schemas"]["UserMovieDisplayResponseDto"];

export type DisplayedUserMovie = components["schemas"]["DisplayedUserMovieDto"];

export type UserMovieDisplayedResponse =
  components["schemas"]["UserMovieDisplayedResponseDto"];

export type UpdateViewingDetails =
  components["schemas"]["UpdateViewingDetailsDto"];

export type ReleaseNotificationRunResult =
  components["schemas"]["ReleaseNotificationRunResponseDto"];

export type WishMovieDetailResponse =
  components["schemas"]["WishMovieDetailResponseDto"];
