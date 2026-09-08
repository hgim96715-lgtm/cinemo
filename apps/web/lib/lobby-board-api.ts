import type { LobbyBoardResponse, WeeklyRevealWinner } from '@cinemo/shared';
import { apiFetch } from './api';

export function getLobbyBoardRequest() {
  return apiFetch<LobbyBoardResponse>('/lobby/board');
}

export function recordLobbyVisitRequest(token: string) {
  return apiFetch<{ ok: true }>('/lobby/visit', {
    method: 'POST',
    token,
  });
}

export function getWeeklyRevealRequest() {
  return apiFetch<WeeklyRevealWinner | null>('/lobby/weekly-reveal');
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

export function getUpcomingMoviesRequest(
  month?: string,
  page = 1,
  limit = 10,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (month) params.set('month', month);

  return apiFetch<UpcomingMoviesResponse>(`/lobby/upcoming?${params}`);
}
