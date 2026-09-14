import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardBoxOfficeMovie, LobbyBoardResponse } from '@cinemo/shared';
import { kstDateKey, todayKstDate } from '../lib/date-kst';
import { TmdbService } from '../tmdb/tmdb.service';
import { AdminService } from '../admin/admin.service';
import { ConfigService } from '@nestjs/config';
import { clamp } from '../lib/clamp';

type KobisUpcomingMovie = {
  titles: string[];
  openDate: string;
};

@Injectable()
export class LobbyBoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  private boxOfficeCache: {
    targetDt: string;
    expiresAt: number;
    movies: BoardBoxOfficeMovie[];
  } | null = null;

  private normalizeMovieTitle(title: string) {
    return title
      .trim()
      .toLocaleLowerCase('ko-KR')
      .replace(/[\s\p{P}\p{S}]+/gu, '');
  }

  private normalizeExternalMovieTitle(title: string) {
    return title
      .trim()
      .toLocaleLowerCase('en-US')
      .replace(/[\s\p{P}\p{S}]+/gu, '');
  }

  private getMovieTitleVariants(title: string) {
    const normalized = this.normalizeExternalMovieTitle(title);
    const withoutPartMarker = normalized.replace(
      /(part|파트|chapter|챕터|volume|vol|편|권)/g,
      '',
    );

    return [...new Set([normalized, withoutPartMarker])].filter(Boolean);
  }

  private isKobisMovieMatch(
    movie: {
      title: string;
      original_title: string;
      release_date: string;
    },
    kobisMovies: KobisUpcomingMovie[],
  ) {
    const tmdbTitles = [movie.title, movie.original_title].flatMap((title) =>
      this.getMovieTitleVariants(title),
    );

    return kobisMovies.some((kobisMovie) => {
      const kobisTitles = kobisMovie.titles.flatMap((title) =>
        this.getMovieTitleVariants(title),
      );

      if (kobisTitles.some((title) => tmdbTitles.includes(title))) {
        return true;
      }

      if (kobisMovie.openDate !== movie.release_date) {
        return false;
      }

      return kobisTitles.some((kobisTitle) =>
        tmdbTitles.some(
          (tmdbTitle) =>
            Math.min(kobisTitle.length, tmdbTitle.length) >= 4 &&
            (kobisTitle.startsWith(tmdbTitle) ||
              tmdbTitle.startsWith(kobisTitle)),
        ),
      );
    });
  }

  private isExcludedUpcomingTitle(title: string) {
    return (
      this.normalizeMovieTitle(title) === this.normalizeMovieTitle('클로저')
    );
  }

  private async getKobisUpcomingMovies(
    fromDate: string,
    untilDate: string,
  ): Promise<KobisUpcomingMovie[] | null> {
    const apiKey = this.configService.get<string>('tmdb.kobisApiKey')?.trim();
    if (!apiKey) return null;

    const url = new URL(
      'https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json',
    );
    url.searchParams.set('key', apiKey);
    url.searchParams.set('openStartDt', fromDate.replaceAll('-', ''));
    url.searchParams.set('openEndDt', untilDate.replaceAll('-', ''));
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

      const movies = (data.movieListResult?.movieList ?? [])
        .filter(
          (movie) =>
            movie.typeNm !== '단편' &&
            Boolean(movie.openDt) &&
            movie.openDt! >= fromDate.replaceAll('-', '') &&
            movie.openDt! <= untilDate.replaceAll('-', ''),
        )
        .map((movie) => ({
          titles: [movie.movieNm, movie.movieNmEn]
            .filter((title): title is string => Boolean(title?.trim()))
            .map((title) => this.normalizeExternalMovieTitle(title)),
          openDate: `${movie.openDt!.slice(0, 4)}-${movie.openDt!.slice(4, 6)}-${movie.openDt!.slice(6, 8)}`,
        }));

      return movies.length > 0 ? movies : null;
    } catch {
      return null;
    }
  }

  private async getBoxOfficeMovies(): Promise<BoardBoxOfficeMovie[]> {
    const KOBIS_DAILY_BOX_OFFICE_URL =
      'https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json';

    const apikey = this.configService.get<string>('tmdb.kobisApiKey')?.trim();

    if (!apikey) return [];

    const targetDt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
    })
      .format(new Date(Date.now() - 24 * 60 * 60 * 1000))
      .replaceAll('-', '');

    const cached = this.boxOfficeCache;
    const fallbackMovies = cached?.movies ?? [];

    if (
      cached &&
      cached.targetDt === targetDt &&
      cached.expiresAt > Date.now()
    ) {
      return cached.movies;
    }

    const url = new URL(KOBIS_DAILY_BOX_OFFICE_URL);
    url.searchParams.set('key', apikey);
    url.searchParams.set('targetDt', targetDt);
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = (await response.json()) as {
        boxOfficeResult?: {
          dailyBoxOfficeList?: Array<{
            movieCd: string;
            rank: string;
            movieNm: string;
            audiCnt: string;
            audiAcc: string;
            rankInten: string;
            rankOldAndNew: string;
          }>;
        };
      };
      const list = data.boxOfficeResult?.dailyBoxOfficeList ?? [];

      const moviePool = await this.prisma.moviePool.findMany({
        where: {
          title: {
            in: list.map((movie) => movie.movieNm),
          },
        },
        select: {
          title: true,
          tmdbId: true,
          posterPath: true,
        },
      });

      const movieMap = new Map(moviePool.map((movie) => [movie.title, movie]));

      const movies = await Promise.all(
        list.map(async (movie) => {
          const pooledMovie = movieMap.get(movie.movieNm);
          let tmdbId = pooledMovie?.tmdbId ?? null;
          let searchedMovie:
            { id: number; poster_path: string | null } | undefined;

          if (!tmdbId) {
            try {
              const result = await this.tmdbService.searchMovies(movie.movieNm);
              searchedMovie =
                result.results.find((item) => item.poster_path) ??
                result.results[0];
              tmdbId = searchedMovie.id ?? null;
            } catch {
              searchedMovie = undefined;
            }
          }
          const posterPath =
            pooledMovie?.posterPath ?? searchedMovie?.poster_path ?? null;
          let trailerUrl: string | null = null;
          let videoType: 'trailer' | 'teaser' | null = null;
          if (tmdbId) {
            try {
              const video = await this.tmdbService.getMovieVideo(tmdbId);
              trailerUrl = video?.url ?? null;
              videoType = video?.videoType ?? null;
            } catch {
              trailerUrl = null;
              videoType = null;
            }
          }
          return {
            kobisMovieCd: movie.movieCd,
            rank: Number(movie.rank),
            title: movie.movieNm,
            dailyAudienceCount: Number(movie.audiCnt),
            audienceCount: Number(movie.audiAcc),
            rankChange:
              movie.rankOldAndNew === 'NEW'
                ? null
                : Number(movie.rankInten) || 0,
            posterPath,
            trailerUrl,
            videoType,
          };
        }),
      );

      this.boxOfficeCache = {
        targetDt,
        expiresAt: Date.now() + 10 * 60 * 1000,
        movies,
      };

      return movies;
    } catch {
      return fallbackMovies;
    }
  }

  async recordVisit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'admin') return { ok: true as const };

    const visitDate = todayKstDate();
    const created = await this.prisma.lobbyVisit.createMany({
      data: { userId, visitDate },
      skipDuplicates: true,
    });
    if (created.count > 0) {
      await this.adminService.countIncrement('visits', new Date(), userId);
    }
    return { ok: true as const };
  }

  async getBoard(): Promise<LobbyBoardResponse> {
    const [upcomingResult, boxOfficeMovies] = await Promise.all([
      this.getUpcomingMovies(undefined, 1, 30),
      this.getBoxOfficeMovies(),
    ]);

    const upcomingInterestMovies = upcomingResult.items
      .sort(
        (a, b) =>
          b.interestCount - a.interestCount ||
          a.title.localeCompare(b.title, 'ko'),
      )
      .slice(0, 5)
      .map((movie, index) => ({
        rank: index + 1,
        ...movie,
      }));

    return {
      boxOfficeMovies: boxOfficeMovies.slice(0, 3),
      upcomingInterestMovies,
    };
  }

  async getMovieChart() {
    const movies = await this.getBoxOfficeMovies();
    const targetDt = this.boxOfficeCache?.targetDt;

    const targetDate = targetDt
      ? `${targetDt.slice(0, 4)}-${targetDt.slice(4, 6)}-${targetDt.slice(6, 8)}`
      : kstDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

    return {
      items: movies,
      targetDate,
      total: movies.length,
    };
  }

  async getUpcomingMovies(month?: string, page = 1, limit = 10) {
    const today = kstDateKey();
    const oneYearLater = new Date(`${today}T00:00:00+09:00`);
    oneYearLater.setUTCDate(oneYearLater.getUTCDate() + 365);

    let fromDate = today;
    let untilDate = oneYearLater.toISOString().slice(0, 10);

    if (month && /^\d{4}$/.test(month)) {
      const year = Number(month);
      const yearStart = new Date(Date.UTC(year, 0, 1))
        .toISOString()
        .slice(0, 10);
      const yearEnd = new Date(Date.UTC(year + 1, 0, 0))
        .toISOString()
        .slice(0, 10);

      fromDate = yearStart > today ? yearStart : today;
      untilDate = yearEnd < untilDate ? yearEnd : untilDate;
    } else if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      const [year, monthNumber] = month.split('-').map(Number);

      const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1))
        .toISOString()
        .slice(0, 10);

      const monthEnd = new Date(Date.UTC(year, monthNumber, 0))
        .toISOString()
        .slice(0, 10);

      fromDate = monthStart > today ? monthStart : today;
      untilDate = monthEnd < untilDate ? monthEnd : untilDate;
    }

    const filters = {
      region: 'KR',
      'release_date.gte': fromDate,
      'release_date.lte': untilDate,
      with_release_type: '2|3',
    };

    const hasKoreanTitle = (title: string) =>
      title.trim() !== '' &&
      !title.includes('정보가 없습니다.') &&
      /\p{Script=Hangul}/u.test(title);

    const responses = await Promise.all(
      [1, 2, 3].map((page) =>
        this.tmdbService.discoverMovies(filters, page, 'ko-KR'),
      ),
    );

    const kobisMovies = await this.getKobisUpcomingMovies(fromDate, untilDate);

    const movies = responses
      .flatMap((response) => response.results)
      .filter(
        (movie) =>
          movie.release_date >= fromDate &&
          movie.release_date <= untilDate &&
          hasKoreanTitle(movie.title) &&
          Boolean(movie.poster_path) &&
          movie.release_date !== '' &&
          !this.isExcludedUpcomingTitle(movie.title),
      )
      .sort((a, b) => a.release_date.localeCompare(b.release_date));

    const movieMap = new Map(
      movies.map((movie) => [
        movie.id,
        {
          tmdbId: movie.id,
          title: movie.title,
          releaseDate: movie.release_date,
          posterPath: movie.poster_path,
          isKobisBacked:
            kobisMovies !== null && this.isKobisMovieMatch(movie, kobisMovies),
        },
      ]),
    );

    const verifiedMovies = await Promise.all(
      [...movieMap.values()].map(async (movie) =>
        (await this.tmdbService.isValidMovieRecord(movie.tmdbId))
          ? movie
          : null,
      ),
    );

    const upcomingMovies = verifiedMovies
      .filter((movie): movie is NonNullable<typeof movie> => movie !== null)
      .sort(
        (a, b) =>
          a.releaseDate.localeCompare(b.releaseDate) ||
          Number(b.isKobisBacked) - Number(a.isKobisBacked),
      );
    const tmdbIds = upcomingMovies.map((movie) => movie.tmdbId);

    const wishCounts = tmdbIds.length
      ? await this.prisma.userMovie.groupBy({
          by: ['tmdbId'],
          where: {
            kind: 'wish',
            tmdbId: { in: tmdbIds },
          },
          _count: {
            tmdbId: true,
          },
        })
      : [];

    const countMap = new Map(
      wishCounts.map((row) => [row.tmdbId, row._count.tmdbId]),
    );

    const safePage = Math.max(1, page);
    const safeLimit = clamp(limit, 1, 30);
    const total = upcomingMovies.length;
    const start = (safePage - 1) * safeLimit;

    const items = upcomingMovies
      .slice(start, start + safeLimit)
      .map((movie) => ({
        tmdbId: movie.tmdbId,
        title: movie.title,
        releaseDate: movie.releaseDate,
        posterPath: movie.posterPath,
        interestCount: countMap.get(movie.tmdbId) ?? 0,
      }));

    return {
      items,
      total,
      hasNext: start + items.length < total,
    };
  }
}
