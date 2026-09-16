export type WatchProvider = {
  id: number;
  name: string;
  logo_path: string;
};

export type MovieVideoType = 'trailer' | 'teaser';

export type MovieCard = {
  id: number;
  title: string;
  original_title?: string;
  original_language?: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  director: string | null;
  cast?: string[];
  providers: WatchProvider[];
  trailerUrl?: string | null;
  videoType?: MovieVideoType | null;
};

export type MovieWithTags = MovieCard & {
  genre_ids: number[];
  origin_countries: string[];
};
