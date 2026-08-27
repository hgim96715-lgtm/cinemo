import type {
  GachaMovie,
  ToggleUserMovieResult,
  UserMovieCounts,
  UserMovieKind,
  UserMovieListPage,
  UserMovieMarks,
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
) {
  return apiFetch<UserMovieListPage>(
    `/user-movies?kind=${kind}&page=${page}&limit=${limit}`,
    { token },
  );
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
