import type { LobbyBoardResponse } from '@cinemo/shared';
import type { components } from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

export function getLobbyBoardRequest() {
  return apiFetch<LobbyBoardResponse>('/lobby/board');
}

export type MovieChartItem = components['schemas']['MovieChartItemDto'];

export type MovieChartResponse = components['schemas']['MovieChartResponseDto'];

export function getMovieChartRequest() {
  return apiFetch<MovieChartResponse>('/lobby/movie-chart');
}

export function recordLobbyVisitRequest(token: string) {
  return apiFetch<{ ok: true }>('/lobby/visit', {
    method: 'POST',
    token,
  });
}

export type UpcomingMovie = {
  tmdbId: number;
  title: string;
  releaseDate: string;
  posterPath: string | null;
  interestCount: number;
};

export type UpcomingMoviesResponse = {
  items: UpcomingMovie[];
  total: number;
  hasNext: boolean;
};

export function getUpcomingMoviesRequest(month?: string, page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (month) params.set('month', month);

  return apiFetch<UpcomingMoviesResponse>(`/lobby/upcoming?${params}`);
}
