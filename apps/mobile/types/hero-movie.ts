export type HeroMovieSource =
  | "CHART"
  | "COMING_SOON"
  | "FAVORITE_TOP_50"
  | "CINEMO_PICK";

export type HeroMovie = {
  id: string;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  description?: string | null;
  rank?: number | null;
  audienceCount?: number | null;
  genres?: string[];
  source: HeroMovieSource;
};
