import type { MovieCard, MovieWithTags } from '@cinemo/shared';
import { apiFetch } from './api-fetch';
import { normalizeSearchQuery } from './search-query';

export type TmdbSearchResponse = {
  page: number;
  total_pages: number;
  results: MovieCard[];
};

export function searchMoviesRequest(token: string, q: string, page = 1) {
  const query = encodeURIComponent(normalizeSearchQuery(q));
  return apiFetch<TmdbSearchResponse>(`/tmdb/search?q=${query}&page=${page}`, {
    token,
  });
}

export type ProviderOverride = {
  id: string;
  tmdbId: number;
  providerId: number;
  providerName: string;
  logoPath: string | null;
  action: 'add' | 'remove';
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertProviderOverrideBody = {
  tmdbId: number;
  providerId: number;
  providerName: string;
  logoPath?: string;
  action: 'add' | 'remove';
  note?: string;
};

export function listProviderOverridesRequest(
  token: string | null,
  tmdbId: number,
) {
  return apiFetch<ProviderOverride[]>(
    `/tmdb/provider-overrides?tmdbId=${tmdbId}`,
    { token },
  );
}

export function upsertProviderOverrideRequest(
  token: string | null,
  body: UpsertProviderOverrideBody,
) {
  return apiFetch<ProviderOverride>('/tmdb/provider-overrides', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}
export function getMovieDetailRequest(tmdbId: number) {
  return apiFetch<MovieWithTags>(`/tmdb/movie/${tmdbId}`);
}
