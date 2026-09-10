import { apiFetch } from './api';

export type MovieQuoteSuggestion = {
  originalText: string;
  koreanText: string;
  originalLanguage: string;
  isPopular: boolean;
  source: string | null;
};

export type RecommendMovieQuotesInput = {
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  originalLanguage: string | null;
  releaseYear: number | null;
  overview: string | null;
};

export function recommendMovieQuotesRequest(
  token: string,
  input: RecommendMovieQuotesInput,
) {
  return apiFetch<MovieQuoteSuggestion[]>('/ai/quote-suggestions', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}
