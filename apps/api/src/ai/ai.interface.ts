export type MovieQuoteSuggestion = {
  originalText: string;
  koreanText: string;
  originalLanguage: string;
  isPopular: boolean;
  source: string | null;
};

export type RecommendMovieQuotesInput = {
  title: string;
  releaseYear: number | null;
  overview: string | null;
};

export interface IAiProvider {
  translateOverview(
    titleEn: string,
    overviewEn: string,
  ): Promise<string | null>;
  koreanTitle(titleEn: string, year: string): Promise<string | null>;
  koreanDirector(name: string): Promise<string | null>;
  recommendMovieQuotes(
    input: RecommendMovieQuotesInput,
  ): Promise<MovieQuoteSuggestion[]>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
