import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardBoxOfficeMovie, LobbyBoardResponse } from '@cinemo/shared';
import { kstDateKey, todayKstDate } from '../lib/date-kst';
import { TmdbService } from '../tmdb/tmdb.service';
import { AdminService } from '../admin/admin.service';
import { clamp } from '../lib/clamp';
import { MovieChartSnapshotService } from './movie-chart-snapshot.service';
import { KobisService } from '../kobis/kobis.service';
import type {
  KobisDailyBoxOfficeMovie,
  KobisUpcomingMovie,
} from '../kobis/kobis.service';

type MovieChartMovie = BoardBoxOfficeMovie & {
  kobisMovieCd: string;
  tmdbId: number | null;
  releaseDate: string | null;
  reReleaseDates: string[];
  dailyAudienceCount: number;
  trailerUrl: string | null;
  videoType: 'trailer' | null;
};

@Injectable()
export class LobbyBoardService {
  private readonly logger = new Logger(LobbyBoardService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly kobisService: KobisService,
    private readonly adminService: AdminService,
    private readonly movieChartSnapshotService: MovieChartSnapshotService,
  ) {}

  private boxOfficeCache: {
    targetDt: string;
    expiresAt: number;
    movies: MovieChartMovie[];
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

  private async getDailyBoxOfficeMovies(
    targetDate?: string,
  ): Promise<MovieChartMovie[]> {
    const cached = this.boxOfficeCache;
    const fallbackMovies = cached?.movies ?? [];
    const targetDt =
      targetDate?.replaceAll('-', '') ??
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
      })
        .format(new Date(Date.now() - 24 * 60 * 60 * 1000))
        .replaceAll('-', '');

    if (
      !targetDate &&
      cached &&
      cached.targetDt === targetDt &&
      cached.expiresAt > Date.now()
    ) {
      return cached.movies;
    }

    try {
      const boxOffice = await this.kobisService.getDailyBoxOffice(targetDate);
      const list: KobisDailyBoxOfficeMovie[] = boxOffice.movies;

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
          releaseDate: true,
        },
      });

      const movieMap = new Map(moviePool.map((movie) => [movie.title, movie]));

      const movies = await Promise.all(
        list.map(async (movie) => {
          const pooledMovie = movieMap.get(movie.movieNm);
          const media = await this.tmdbService.resolveMovieMedia(
            movie.movieNm,
            {
              tmdbId: pooledMovie?.tmdbId,
              posterPath: pooledMovie?.posterPath,
            },
          );

          return {
            kobisMovieCd: movie.movieCd,
            tmdbId: media.tmdbId,
            rank: Number(movie.rank),
            title: movie.movieNm,
            releaseDate: pooledMovie?.releaseDate || null,
            reReleaseDates: media.reReleaseDates,
            dailyAudienceCount: Number(movie.audiCnt),
            audienceCount: Number(movie.audiAcc),
            rankChange:
              movie.rankOldAndNew === 'NEW'
                ? null
                : Number(movie.rankInten) || 0,
            posterPath: media.posterPath,
            trailerUrl: media.trailerUrl,
            videoType: media.videoType,
          };
        }),
      );

      if (!targetDate) {
        this.boxOfficeCache = {
          targetDt: boxOffice.targetDt,
          expiresAt: Date.now() + 10 * 60 * 1000,
          movies,
        };
      }

      return movies;
    } catch {
      return targetDate ? [] : fallbackMovies;
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
      this.getDailyBoxOfficeMovies(),
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
    const movies = await this.getDailyBoxOfficeMovies();
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

  async collectDailyMovieChart(targetDate: string) {
    const movies = await this.getDailyBoxOfficeMovies(targetDate);
    if (movies.length === 0) {
      return {
        targetDate,
        saved: 0,
      };
    }
    await this.movieChartSnapshotService.saveDailysnapshot(targetDate, movies);
    return {
      targetDate,
      saved: movies.length,
    };
  }

  async backfillMovieChart(fromDate: string, toDate: string) {
    if (fromDate > toDate) {
      throw new BadRequestException(
        '백필 시작일은 종료일보다 늦을 수 없습니다.',
      );
    }

    const cursor = new Date(`${fromDate}T00:00:00+09:00`);
    const end = new Date(`${toDate}T00:00:00+09:00`);
    const days =
      Math.floor((end.getTime() - cursor.getTime()) / 86_400_000) + 1;

    if (days > 90) {
      throw new BadRequestException(
        '한 번에 최대 90일까지 백필할 수 있습니다.',
      );
    }

    this.logger.log(`영화 차트 백필 시작: ${fromDate} ~ ${toDate}`);

    let saved = 0;
    const failedDates: string[] = [];

    while (cursor <= end) {
      const targetDate = kstDateKey(cursor);

      try {
        const result = await this.collectDailyMovieChart(targetDate);

        saved += result.saved;
        this.logger.log(`${targetDate} 백필 완료: ${result.saved}건`);
      } catch (error: unknown) {
        failedDates.push(targetDate);

        this.logger.error(
          `${targetDate} 백필 실패`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    this.logger.log(
      `영화 차트 백필 완료: 총 ${saved}건, 실패 ${failedDates.length}일`,
    );

    return {
      fromDate,
      toDate,
      saved,
      failedDates,
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

    const kobisMovies = await this.kobisService.getUpcomingMovies(
      fromDate,
      untilDate,
    );

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
      [...movieMap.values()].map(async (movie) => {
        try {
          const detail = await this.tmdbService.getMovieCached(movie.tmdbId);

          if (!detail.title?.trim() || !detail.release_date?.trim()) {
            return null;
          }

          return {
            ...movie,
          };
        } catch {
          return null;
        }
      }),
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
        isReleaseDateConfirmed: movie.isKobisBacked,
      }));

    return {
      items,
      total,
      hasNext: start + items.length < total,
    };
  }
}
