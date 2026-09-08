import { GachaMovie } from "./gacha";

export type BoardBoxOfficeMovie = {
  rank: number;
  title: string;
  audienceCount: number;
  rankChange: number | null;
  posterPath: string | null;
};

export type BoardUpcomingInterestMovie = {
  rank: number;
  tmdbId: number;
  title: string;
  releaseDate: string;
  interestCount: number;
  posterPath: string | null;
};

export type BoardWeekTopMovie = {
  tmdbId: number;
  title: string;
  count: number;
};

/** 전광판 막대 시리즈  */
export type LobbyBoardResponse = {
  weekReviewCount: number;
  weekTopMovies: BoardWeekTopMovie[];

  boxOfficeMovies: BoardBoxOfficeMovie[];
  upcomingInterestMovies: BoardUpcomingInterestMovie[];
};

export type WeeklyRevealWinner = {
  tmdbId: number;
  title: string;
  count: number;
  sampleBody: string | null;
  movie: GachaMovie;
};
