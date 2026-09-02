import type {
  GachaMovie,
  ToggleUserMovieResult,
  UserMovieCalendar,
  UserMovieCounts,
  UserMovieKind,
  UserMovieListPage,
  UserMovieMarks,
  UserMovieStats,
} from '@cinemo/shared';
import { apiFetch } from './api';

export function toggleUserMovieRequest(
  token: string,
  tmdbId: number,
  kind: UserMovieKind,
) {
  return apiFetch<ToggleUserMovieResult>('/user-movies/toggle', {
    method: 'POST',
    token,
    body: JSON.stringify({ tmdbId, kind }),
  });
}

export function getUserMovieMarksRequest(token: string, tmdbId: number) {
  return apiFetch<UserMovieMarks>(`/user-movies/marks?tmdbId=${tmdbId}`, {
    token,
  });
}

export function listUserMoviesRequest(
  token: string,
  kind: UserMovieKind,
  page = 1,
  limit = 24,
  filters?: {
    search?: string;
    year?: number;
    month?: number;
  },
) {
  const params = new URLSearchParams({
    kind,
    page: String(page),
    limit: String(limit),
  });

  const search = filters?.search?.trim();

  if (search) params.set('search', search);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.month) params.set('month', String(filters.month));

  return apiFetch<UserMovieListPage>(`/user-movies?${params.toString()}`, {
    token,
  });
}

export function getUserMovieCountsRequest(token: string) {
  return apiFetch<UserMovieCounts>('/user-movies/counts', { token });
}

export type UpdateDisplayBody = {
  tmdbId: number;
  kind: 'watched';
  isDisplayed: boolean;
  wallSlot: number;
};

export type UserMovieDisplayResult = {
  tmdbId: number;
  kind: 'watched';
  isDisplayed: boolean;
  wallSlot: number | null;
  displayOrder: number | null;
};

export function updateUserMovieDisplayRequest(
  token: string,
  body: UpdateDisplayBody,
) {
  return apiFetch<UserMovieDisplayResult>('/user-movies/display', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export type DisplayedUserMovie = {
  tmdbId: number;
  wallSlot: number;
  displayOrder: number | null;
  movie: GachaMovie;
};

export function listDisplayedUserMoviesRequest(token: string) {
  return apiFetch<{ items: DisplayedUserMovie[] }>('/user-movies/displayed', {
    token,
  });
}

export function getUserMovieCalendarRequest(
  token: string,
  year: number,
  month: number,
) {
  return apiFetch<UserMovieCalendar>(
    `/user-movies/calendar?year=${year}&month=${month}`,
    { token },
  );
}

export function addWatchedMovieRequest(
  token: string,
  tmdbId: number,
  watchedAt: string,
) {
  return apiFetch('/user-movies/watched-at', {
    method: 'POST',
    token,
    body: JSON.stringify({ tmdbId, watchedAt }),
  });
}

export function getUserMovieStatsRequest(token: string, year: number) {
  return apiFetch<UserMovieStats>(`/user-movies/stats?year=${year}`, { token });
}

export function updateWatchedAtRequest(
  token: string,
  tmdbId: number,
  watchedAt: string,
) {
  return apiFetch('/user-movies/watched-at', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ tmdbId, watchedAt }),
  });
}

export function removeWatchedMovieRequest(token: string, tmdbId: number) {
  return apiFetch(`/user-movies/watched-at/${tmdbId}`, {
    method: 'DELETE',
    token,
  });
}
