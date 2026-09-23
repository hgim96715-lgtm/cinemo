import type {
  MovieQuoteSuggestion,
  RecommendMovieQuotesInput,
} from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

export type { MovieQuoteSuggestion, RecommendMovieQuotesInput };

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
