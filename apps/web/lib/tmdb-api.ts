import type { MovieDetail, MovieSearchResponse } from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';
import { normalizeSearchQuery } from './search-query';

export type TmdbSearchResponse = MovieSearchResponse;

export function searchMoviesRequest(token: string, q: string, page = 1) {
  const query = encodeURIComponent(normalizeSearchQuery(q));

  return apiFetch<TmdbSearchResponse>(`/tmdb/search?q=${query}&page=${page}`, {
    token,
  });
}

export function getMovieDetailRequest(tmdbId: number) {
  return apiFetch<MovieDetail>(`/tmdb/movie/${tmdbId}`);
}
