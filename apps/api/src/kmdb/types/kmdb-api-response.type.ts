export type KmdbMovieResult = {
  DOCID?: string;
  title?: string;
  titleEtc?: string;
  prodYear?: string;
  genre?: string;
  repRlsDate?: string;
  posters?: string;
  plots?: {
    plot?: Array<{
      plotLang?: string;
      plotText?: string;
    }>;
  };
  directors?: {
    director?: Array<{
      directorNm?: string;
    }>;
  };
  actors?: {
    actor?: Array<{
      actorNm?: string;
    }>;
  };
  ratings?: {
    rating?: Array<{
      releaseDate?: string;
    }>;
  };
  vods?: {
    vod?: Array<{
      vodClass?: string;
      vodUrl?: string;
    }>;
  };
  [key: string]: unknown;
};

export type KmdbSearchResponse = {
  Data?: Array<{
    TotalCount?: number;
    Result?: KmdbMovieResult[];
  }>;
};
