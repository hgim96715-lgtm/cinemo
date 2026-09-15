import type { components } from './generated/api';

export type MovieChartItem =
  components['schemas']['MovieChartItemDto'];

export type MovieChartResponse =
  components['schemas']['MovieChartResponseDto'];

export type MovieChartStatsItem =
  components['schemas']['MovieChartStatsItemDto'];

export type MovieChartStatsResponse =
  components['schemas']['MovieChartStatsResponseDto'];

export type MovieChartHistoryItem =
  components['schemas']['MovieChartHistoryItemDto'];

export type MovieChartHistoryResponse = MovieChartHistoryItem[];

export type UpcomingMovie = components['schemas']['UpcomingMovieDto'];

export type UpcomingMoviesResponse =
  components['schemas']['UpcomingMoviesResponseDto'];
