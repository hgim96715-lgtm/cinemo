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

export type LobbyBoardResponse = {
  boxOfficeMovies: BoardBoxOfficeMovie[];
  upcomingInterestMovies: BoardUpcomingInterestMovie[];
};
