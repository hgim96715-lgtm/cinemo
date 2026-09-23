export const USER_MOVIE_KINDS = ["wish", "watched"] as const;

export type UserMovieKind = (typeof USER_MOVIE_KINDS)[number];

export const USER_MOVIE_VIEWING_TYPES = ["theater", "home", "other"] as const;

export type UserMovieViewingType = (typeof USER_MOVIE_VIEWING_TYPES)[number];
