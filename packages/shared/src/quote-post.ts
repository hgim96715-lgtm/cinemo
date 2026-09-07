import type { GachaMovie } from "./gacha";

export type QuotePostItem = {
  id: string;
  authorId: string;
  tmdbId: number;
  text: string;
  originalText: string | null;
  originalLanguage: string | null;
  usePosterBackground: boolean;
  nickname: string;
  createdAt: string;
  isSaved: boolean;
  movie: GachaMovie;
};

export type QuotePostPage = {
  items: QuotePostItem[];
  nextCursor: string | null;
};

export type CreateQuotePostInput = {
  tmdbId: number;
  text: string;
  originalText?: string | null;
  originalLanguage?: string | null;
  usePosterBackground: boolean;
};
