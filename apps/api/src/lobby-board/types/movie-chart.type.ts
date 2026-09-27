import type { BoardBoxOfficeMovieDto } from '../dto/lobby-board.dto';

export type MovieChartMovie = BoardBoxOfficeMovieDto & {
  kobisMovieCd: string;
  tmdbId: number | null;
  releaseDate: string | null;
  dailyAudienceCount: number;
  trailerUrl: string | null;
  videoType: 'trailer' | null;
};
