export type KobisUpcomingMovie = {
  titles: string[];
  openDate: string;
};

export type KobisDailyBoxOfficeMovie = {
  movieCd: string;
  rank: string;
  movieNm: string;
  openDt: string;
  audiCnt: string;
  audiAcc: string;
  rankInten: string;
  rankOldAndNew: string;
};

export type KobisDailyBoxOfficeResponse = {
  targetDt: string;
  movies: KobisDailyBoxOfficeMovie[];
};

export type KobisMovieListItem = {
  movieNm: string;
  movieNmEn?: string;
  typeNm?: string;
  openDt?: string;
};

export type KobisMovieListApiResponse = {
  movieListResult?: {
    movieList?: KobisMovieListItem[];
  };
};

export type KobisDailyBoxOfficeApiResponse = {
  boxOfficeResult?: {
    dailyBoxOfficeList?: KobisDailyBoxOfficeMovie[];
  };
};
