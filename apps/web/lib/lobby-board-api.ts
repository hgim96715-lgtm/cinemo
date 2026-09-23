import type {
  LobbyBoardResponse,
  MovieChartHistoryResponse,
  MovieChartResponse,
  MovieChartStatsResponse,
  UpcomingMoviesResponse,
} from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

export type {
  MovieChartHistoryItem,
  MovieChartHistoryResponse,
  MovieChartItem,
  MovieChartResponse,
  MovieChartStatsResponse,
  UpcomingMovie,
  UpcomingMoviesResponse,
} from '@cinemo/api-contract';

export function getLobbyBoardRequest() {
  return apiFetch<LobbyBoardResponse>('/lobby/board');
}

export function getMovieChartRequest() {
  return apiFetch<MovieChartResponse>('/lobby/movie-chart');
}

export function recordLobbyVisitRequest(token: string) {
  return apiFetch<{ ok: true }>('/lobby/visit', {
    method: 'POST',
    token,
  });
}

export function getUpcomingMoviesRequest(month?: string, page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (month) params.set('month', month);

  return apiFetch<UpcomingMoviesResponse>(`/lobby/upcoming?${params}`);
}

export function getMovieChartStatsRequest(from: string, to: string) {
  const params = new URLSearchParams({ from, to });

  return apiFetch<MovieChartStatsResponse>(
    `/lobby/movie-chart/stats?${params.toString()}`,
  );
}

export function getMovieChartHistoryRequest(from: string, to: string) {
  const params = new URLSearchParams({ from, to });

  return apiFetch<MovieChartHistoryResponse>(
    `/lobby/movie-chart/history?${params.toString()}`,
  );
}
