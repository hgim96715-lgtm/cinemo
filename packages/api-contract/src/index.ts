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

export type LobbyBoardResponse = components["schemas"]["LobbyBoardResponseDto"];

export type LobbyVisitResponse = components["schemas"]["LobbyVisitResponseDto"];

export type CinemaResponse = components["schemas"]["CinemaResponseDto"];

export type LegalDongArea = components["schemas"]["LegalDongAreaResponseDto"];

export type RegionSyncResponse = components["schemas"]["RegionSyncResponseDto"];

export type RegionResponse = components["schemas"]["RegionResponseDto"];

export type CinemaPageResponse = components["schemas"]["CinemaPageResponseDto"];

export type PlaceSearchResult = components["schemas"]["PlaceSearchResultDto"];

export type CinemaAnalysisResponse =
  components["schemas"]["CinemaAnalysisResponseDto"];

export type AuthUser = components["schemas"]["AuthUserResponseDto"];

export type AuthResponse = components["schemas"]["AuthResponseDto"];

export type AvailabilityResponse =
  components["schemas"]["AvailabilityResponseDto"];

export type MessageResponse = components["schemas"]["MessageResponseDto"];

export type MovieQuoteSuggestion =
  components["schemas"]["MovieQuoteSuggestionResponseDto"];

export type RecommendMovieQuotesInput =
  components["schemas"]["RecommendMovieQuotesDto"];

export type HealthResponse = components["schemas"]["HealthResponseDto"];

export type KobisMovieInfoResponse =
  components["schemas"]["KobisMovieInfoResponseDto"];

export type KobisMovieSearchResponse =
  components["schemas"]["KobisMovieSearchResponseDto"];

export type PublicProfileResponse =
  components["schemas"]["PublicProfileResponseDto"];

export type UserMovieListItem = components["schemas"]["UserMovieListItemDto"];

export type UserMovieListPage =
  components["schemas"]["UserMovieListResponseDto"];

export type ToggleUserMovieResult =
  components["schemas"]["ToggleUserMovieResponseDto"];

export type UserMovieStatus =
  components["schemas"]["UserMovieStatusResponseDto"];

export type UserMovieCounts =
  components["schemas"]["UserMovieCountsResponseDto"];

export type UserMovieStats = components["schemas"]["UserMovieStatsResponseDto"];

export type UserMovieRecord =
  components["schemas"]["UserMovieRecordResponseDto"];

export type ReleaseNotificationResponse =
  components["schemas"]["ReleaseNotificationResponseDto"];

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

export type PostcardReactionSummary =
  components["schemas"]["PostcardReactionResponseDto"];

export type PostcardItem = components["schemas"]["PostcardItemResponseDto"];

export type PostcardSummary =
  components["schemas"]["PostcardSummaryResponseDto"];

export type PostcardTogglePinnedResponse =
  components["schemas"]["PostcardTogglePinnedResponseDto"];

export type PostcardToggleBookmarkResponse =
  components["schemas"]["PostcardToggleBookmarkResponseDto"];

export type PostcardToggleReactionResponse =
  components["schemas"]["PostcardToggleReactionResponseDto"];

export type PostcardCommentAuthor =
  components["schemas"]["PostcardCommentAuthorResponseDto"];

export type PostcardCommentItem =
  components["schemas"]["PostcardCommentResponseDto"];

export type PostcardDeleteResponse =
  components["schemas"]["PostcardDeleteResponseDto"];

export type UserMovieCalendarItem =
  components["schemas"]["UserMovieCalendarItemDto"];

export type UserMovieCalendarResponse =
  components["schemas"]["UserMovieCalendarResponseDto"];
