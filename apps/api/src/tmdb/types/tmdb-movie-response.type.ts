export type TmdbVideoResponse = {
  key: string;
  site: string;
  type: string;
  official: boolean;
};

export type TmdbMovieDetailResponse = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  credits?: {
    crew: {
      job: string;
      name: string;
    }[];
    cast?: {
      name: string;
      order: number;
    }[];
  };
  videos?: {
    results: TmdbVideoResponse[];
  };
  genres?: {
    id: number;
    name: string;
  }[];
  production_countries?: {
    iso_3166_1: string;
    name: string;
  }[];
};
