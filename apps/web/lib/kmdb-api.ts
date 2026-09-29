import { apiFetch } from './api-fetch';

export type KmdbMovieResult = {
  title: string;
  releaseDate: string | null;
  posterUrl: string | null;
  vodUrl: string | null;
  overview: string | null;
  director: string | null;
  cast: string[];
  genres: string[];
  productionYear: string | null;
  isReRelease: boolean;
};

type KmdbSearchResponse = {
  totalCount: number;
  results: KmdbMovieResult[];
};

export function searchKmdbMoviesRequest(
  query: string,
  page = 1,
  limit = 1,
) {
  const params = new URLSearchParams({
    query,
    page: String(page),
    limit: String(limit),
  });

  return apiFetch<KmdbSearchResponse>(`/kmdb/movies/search?${params}`);
}
