export const USER_MOVIE_KINDS = ["wish", "watched"] as const;

export type UserMovieKind = (typeof USER_MOVIE_KINDS)[number];

export const USER_MOVIE_VIEWING_TYPES = ["theater", "home", "other"] as const;

export type UserMovieViewingType = (typeof USER_MOVIE_VIEWING_TYPES)[number];

export type UserMovieViewingDetails = {
  viewingType: UserMovieViewingType | null;
  viewingTypeCustom: string | null;
  viewingPlatform: string | null;
  viewingLocation: string | null;
  review: string | null;
  rating: number | null;
};

type UserMovieMovie = {
  id: number;
  title: string;
  original_title?: string;
  original_language?: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  director: string | null;
  cast?: string[];
  trailerUrl?: string | null;
  videoType?: "trailer" | null;
};

export type ToggleUserMovieResult = {
  tmdbId: number;
  kind: UserMovieKind;
  active: boolean;
};

export type UserMovieMarks = {
  tmdbId: number;
  wish: boolean;
  watched: boolean;
};

export type UserMovieListItem = UserMovieViewingDetails & {
  tmdbId: number;
  updatedAt: string;
  watchedAt: string | null;
  movie: UserMovieMovie;
};

export type UserMovieListPage = {
  items: UserMovieListItem[];
  page: number;
  total: number;
  hasMore: boolean;
};
export type UserMovieCounts = {
  wish: number;
  watched: number;
};

export type UserMovieCalendarItem = {
  tmdbId: number;
  date: string;
  watchedAt: string;
  movie: UserMovieMovie;
};

export type UserMovieCalendar = {
  year: number;
  month: number;
  items: UserMovieCalendarItem[];
};

export type UserMovieStats = {
  year: number;
  total: number;
  monthly: Array<{
    month: number;
    count: number;
  }>;
};
