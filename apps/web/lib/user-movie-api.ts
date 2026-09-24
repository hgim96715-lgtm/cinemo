import type { UserMovieKind } from '@cinemo/shared';
import type {
  ToggleUserMovieResult,
  UserMovieCounts,
  UserMovieDisplayResult,
  UserMovieDisplayedResponse,
  UserMovieListPage,
  UserMovieStatus,
  UserMovieStats,
  UserMovieRecord,
  ReleaseNotificationResponse,
  UpdateViewingDetails,
  UpdateDisplayDto,
  WishMovieDetailResponse,
} from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

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

export function getMovieStatusRequest(token: string, tmdbId: number) {
  return apiFetch<UserMovieStatus>(`/user-movies/status?tmdbId=${tmdbId}`, {
    token,
  });
}

export function listUserMoviesRequest(
  token: string,
  kind: UserMovieKind,
  take = 9,
  cursor?: string,
) {
  const params = new URLSearchParams({
    kind,
    take: String(take),
  });

  if (cursor) {
    params.set('cursor', cursor);
  }

  return apiFetch<UserMovieListPage>(`/user-movies?${params.toString()}`, {
    token,
  });
}

export function getUserMovieCountsRequest(token: string) {
  return apiFetch<UserMovieCounts>('/user-movies/counts', { token });
}

export function updateUserMovieDisplayRequest(
  token: string,
  body: UpdateDisplayDto,
) {
  return apiFetch<UserMovieDisplayResult>('/user-movies/display', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function listDisplayedUserMoviesRequest(token: string) {
  return apiFetch<UserMovieDisplayedResponse>('/user-movies/displayed', {
    token,
  });
}

export function addWatchedMovieRequest(
  token: string,
  tmdbId: number,
  watchedAt: string,
) {
  return apiFetch<UserMovieRecord>('/user-movies/watched-at', {
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
  return apiFetch<UserMovieRecord>('/user-movies/watched-at', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ tmdbId, watchedAt }),
  });
}

export function removeWatchedMovieRequest(token: string, tmdbId: number) {
  return apiFetch<ToggleUserMovieResult>(`/user-movies/watched-at/${tmdbId}`, {
    method: 'DELETE',
    token,
  });
}

type UpdateUserMovieViewingDetailsInput = Omit<UpdateViewingDetails, 'tmdbId'>;

export function updateViewingDetailsRequest(
  token: string,
  tmdbId: number,
  details: UpdateUserMovieViewingDetailsInput,
) {
  return apiFetch<UserMovieRecord>('/user-movies/viewing-details', {
    method: 'PATCH',
    token,
    body: JSON.stringify({
      tmdbId,
      ...details,
    }),
  });
}

export function getWishMovieDetailRequest(token: string, tmdbId: number) {
  return apiFetch<WishMovieDetailResponse>(
    `/user-movies/wish-detail/${tmdbId}`,
    { token },
  );
}

export function getMovieReleaseNotificationRequest(
  token: string,
  tmdbId: number,
) {
  return apiFetch<ReleaseNotificationResponse>(
    `/user-movies/release-notification?tmdbId=${tmdbId}`,
    { token },
  );
}

export function updateMovieReleaseNotificationRequest(
  token: string,
  tmdbId: number,
  enabled: boolean,
  releaseDate: string,
) {
  return apiFetch<ReleaseNotificationResponse>(
    '/user-movies/release-notification',
    {
      method: 'PATCH',
      token,
      body: JSON.stringify({
        tmdbId,
        enabled,
        releaseDate,
      }),
    },
  );
}
