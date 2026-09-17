import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../config/env.keys';

export type KobisUpcomingMovie = {
  titles: string[];
  openDate: string;
};

export type KobisDailyBoxOfficeMovie = {
  movieCd: string;
  rank: string;
  movieNm: string;
  audiCnt: string;
  audiAcc: string;
  rankInten: string;
  rankOldAndNew: string;
};

export type KobisDailyBoxOfficeResponse = {
  targetDt: string;
  movies: KobisDailyBoxOfficeMovie[];
};

@Injectable()
export class KobisService {
  private readonly dailyBoxOfficeUrl =
    'https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json';

  private readonly movieListUrl =
    'https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json';

  private readonly movieInfoUrl =
    'https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json';

  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>(EnvKeys.KOBIS_API_KEY)?.trim();
  }

  async getMovieInfo(movieCd: string): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('KOBIS API 키가 없습니다.');
    }

    const url = new URL(this.movieInfoUrl);

    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('movieCd', movieCd);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`KOBIS 영화 상세 요청 실패 (${response.status})`);
    }

    return response.json();
  }

  async searchMovies(movieName: string): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('KOBIS API 키가 없습니다.');
    }

    const url = new URL(this.movieListUrl);

    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('movieNm', movieName.trim());
    url.searchParams.set('itemPerPage', '10');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`KOBIS 영화 검색 요청 실패 (${response.status})`);
    }

    return response.json();
  }

  async getUpcomingMovies(
    fromDate: string,
    untilDate: string,
  ): Promise<KobisUpcomingMovie[] | null> {
    if (!this.apiKey) return null;

    const url = new URL(this.movieListUrl);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('openStartDt', fromDate.slice(0, 4));
    url.searchParams.set('openEndDt', untilDate.slice(0, 4));
    url.searchParams.set('itemPerPage', '100');

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = (await response.json()) as {
        movieListResult?: {
          movieList?: Array<{
            movieNm: string;
            movieNmEn?: string;
            typeNm?: string;
            openDt?: string;
          }>;
        };
      };

      const fromKey = fromDate.replaceAll('-', '');
      const untilKey = untilDate.replaceAll('-', '');

      const movies = (data.movieListResult?.movieList ?? [])
        .filter(
          (movie) =>
            movie.typeNm !== '단편' &&
            Boolean(movie.openDt) &&
            movie.openDt! >= fromKey &&
            movie.openDt! <= untilKey,
        )
        .map((movie) => ({
          titles: [movie.movieNm, movie.movieNmEn]
            .filter((title): title is string => Boolean(title?.trim()))
            .map((title) => this.normalizeTitle(title)),
          openDate: `${movie.openDt!.slice(0, 4)}-${movie.openDt!.slice(4, 6)}-${movie.openDt!.slice(6, 8)}`,
        }));

      return movies.length > 0 ? movies : null;
    } catch {
      return null;
    }
  }

  async getDailyBoxOffice(
    targetDate?: string,
  ): Promise<KobisDailyBoxOfficeResponse> {
    const targetDt = targetDate
      ? targetDate.replaceAll('-', '')
      : new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Seoul',
        })
          .format(new Date(Date.now() - 24 * 60 * 60 * 1000))
          .replaceAll('-', '');

    if (!this.apiKey) {
      return { targetDt, movies: [] };
    }

    const url = new URL(this.dailyBoxOfficeUrl);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('targetDt', targetDt);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`KOBIS 요청 실패 (${response.status})`);
    }

    const data = (await response.json()) as {
      boxOfficeResult?: {
        dailyBoxOfficeList?: KobisDailyBoxOfficeMovie[];
      };
    };

    return {
      targetDt,
      movies: data.boxOfficeResult?.dailyBoxOfficeList ?? [],
    };
  }

  private normalizeTitle(title: string): string {
    return title
      .trim()
      .toLocaleLowerCase('en-US')
      .replace(/[\s\p{P}\p{S}]+/gu, '');
  }
}
