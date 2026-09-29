import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { kstDateKey, todayKstDate } from '../lib/date-kst';
import { TmdbService } from '../tmdb/tmdb.service';
import { AdminService } from '../admin/admin.service';
import { clamp } from '../lib/clamp';
import { MovieChartSnapshotService } from './movie-chart-snapshot.service';
import { KobisService } from '../kobis/kobis.service';
import type {
  KobisDailyBoxOfficeMovie,
  KobisUpcomingMovie,
} from '../kobis/types/kobis-api-response.type';
import type { MovieChartMovie } from './types/movie-chart.type';
import {
  BoardBoxOfficeMovieDto,
  LobbyBoardResponseDto,
} from './dto/lobby-board.dto';
import { KmdbService } from '../kmdb/kmdb.service';

type KmdbFallbackMovie = {
  DOCID?: string;
  title?: string;
  releaseDate?: string | null;
  posterUrl?: string | null;
  vodUrl?: string | null;
};

@Injectable()
export class LobbyBoardService {
  private readonly logger = new Logger(LobbyBoardService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly kobisService: KobisService,
    private readonly adminService: AdminService,
    private readonly kmdbService: KmdbService,
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

  private async findKmdbFallback(
    title: string,
  ): Promise<KmdbFallbackMovie | null> {
    const cachedMovie = await this.prisma.moviePool.findFirst({
      where: {
        title,
        kmdbDocId: {
          not: null,
        },
      },
      select: {
        kmdbDocId: true,
        kmdbReleaseDate: true,
        kmdbPosterUrl: true,
        kmdbVodUrl: true,
      },
    });

    if (cachedMovie?.kmdbDocId) {
      return {
        DOCID: cachedMovie.kmdbDocId,
        releaseDate: cachedMovie.kmdbReleaseDate,
        posterUrl: cachedMovie.kmdbPosterUrl,
        vodUrl: cachedMovie.kmdbVodUrl,
      };
    }

    try {
      const response = await this.kmdbService.searchMovies(title, 1, 10);
      const normalizedTitle = this.normalizeMovieTitle(title);
      const matchingResults = response.results.filter((result) => {
        const normalizedResultTitle = this.normalizeMovieTitle(result.title);

        return (
          normalizedResultTitle === normalizedTitle ||
          normalizedResultTitle.includes(normalizedTitle) ||
          normalizedTitle.includes(normalizedResultTitle)
        );
      });
      const movie =
        matchingResults.find((result) => result.posterUrl) ??
        matchingResults[0];

      if (!movie) return null;

      return {
        DOCID: movie.DOCID,
        title: movie.title,
        releaseDate: movie.releaseDate,
        posterUrl: movie.posterUrl,
        vodUrl: movie.vodUrl,
      };
    } catch {
      return null;
    }
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
          kmdbDocId: true,
          kmdbReleaseDate: true,
          kmdbPosterUrl: true,
          kmdbVodUrl: true,
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

          const kmdbMovie =
            !media.posterPath || !media.trailerUrl
              ? await this.findKmdbFallback(movie.movieNm)
              : null;

          if (media.tmdbId && kmdbMovie?.DOCID) {
            await this.prisma.moviePool.updateMany({
              where: {
                tmdbId: media.tmdbId,
              },
              data: {
                kmdbDocId: kmdbMovie.DOCID,
                kmdbReleaseDate: kmdbMovie.releaseDate,
                kmdbPosterUrl: kmdbMovie.posterUrl,
                kmdbVodUrl: kmdbMovie.vodUrl,
              },
            });
          }

          return {
            kobisMovieCd: movie.movieCd,
            tmdbId: media.tmdbId,
            rank: Number(movie.rank),
            title: movie.movieNm,
            releaseDate:
              movie.openDt ||
              pooledMovie?.releaseDate ||
              pooledMovie?.kmdbReleaseDate ||
              kmdbMovie?.releaseDate ||
              null,
            dailyAudienceCount: Number(movie.audiCnt),
            audienceCount: Number(movie.audiAcc),
            rankChange:
              movie.rankOldAndNew === 'NEW'
                ? null
                : Number(movie.rankInten) || 0,
            posterPath:
              media.posterPath ||
              pooledMovie?.kmdbPosterUrl ||
              kmdbMovie?.posterUrl ||
              null,
            trailerUrl:
              media.trailerUrl ||
              pooledMovie?.kmdbVodUrl ||
              kmdbMovie?.vodUrl ||
              null,
            videoType:
              media.videoType ||
              (pooledMovie?.kmdbVodUrl || kmdbMovie?.vodUrl ? 'trailer' : null),
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

  async getBoard(): Promise<LobbyBoardResponseDto> {
    const [upcomingResult, boxOfficeMovies] = await Promise.all([
      this.getUpcomingMovies(undefined, 1, 30),
      this.getDailyBoxOfficeMovies(),
    ]);

    const upcomingInterestMovies = upcomingResult.items
      .filter((movie) => movie.tmdbId !== null)
      .sort(
        (a, b) =>
          b.interestCount - a.interestCount ||
          a.title.localeCompare(b.title, 'ko'),
      )
      .slice(0, 5)
      .map((movie, index) => ({
        rank: index + 1,
        tmdbId: movie.tmdbId!,
        title: movie.title,
        releaseDate: movie.releaseDate,
        interestCount: movie.interestCount,
        posterPath: movie.posterPath,
      }));

    return {
      boxOfficeMovies: boxOfficeMovies.slice(0, 3).map((movie) => ({
        rank: movie.rank,
        title: movie.title,
        audienceCount: movie.audienceCount,
        rankChange: movie.rankChange,
        posterPath: movie.posterPath,
      })),
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
    // DB 연결 실패를 빈 결과로 오인하지 않도록 조회 시작 시 연결 상태를 확인
    await this.prisma.$queryRaw`SELECT 1`;

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
      'primary_release_date.gte': fromDate,
      'primary_release_date.lte': untilDate,
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

    const genreResponse = await this.tmdbService.getMovieGenres();
    const genreNameById = new Map(
      genreResponse.genres.map((genre) => [genre.id, genre.name]),
    );
    const formatKmdbDate = (date?: string | null) => {
      if (!date || !/^\d{8}$/.test(date)) return null;

      return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    };

    const kmdbOnlyMovies = await Promise.all(
      (kobisMovies ?? []).map(async (kobisMovie) => {
        const title = kobisMovie.titles[0]?.trim();

        if (!title) return null;

        const existsInTmdb = [...movieMap.values()].some(
          (movie) =>
            this.normalizeMovieTitle(movie.title) ===
            this.normalizeMovieTitle(title),
        );

        if (existsInTmdb) return null;

        const movie = await this.findKmdbFallback(title);

        if (!movie) return null;

        return {
          tmdbId: null,
          title,
          // upcoming의 일정 기준은 KMDb의 과거 개봉일이 아니라 KOBIS 개봉 예정일임
          releaseDate: kobisMovie.openDate,
          posterPath: movie.posterUrl || null,
          isKobisBacked: true,
        };
      }),
    );

    const allMovies = [
      ...movieMap.values(),
      ...kmdbOnlyMovies.filter(
        (movie): movie is NonNullable<typeof movie> => movie !== null,
      ),
    ];

    const verifiedMovies = await Promise.all(
      allMovies.map(async (movie) => {
        if (movie.tmdbId === null) {
          return {
            ...movie,
            genres: [],
          };
        }

        try {
          const detail = await this.tmdbService.getMovieCached(movie.tmdbId);

          const needsKmdbFallback = !detail.poster_path || !detail.release_date;

          const kmdbMovie = needsKmdbFallback
            ? await this.findKmdbFallback(movie.title)
            : null;

          if (kmdbMovie?.DOCID) {
            await this.prisma.moviePool.updateMany({
              where: {
                tmdbId: movie.tmdbId,
              },
              data: {
                kmdbDocId: kmdbMovie.DOCID,
                kmdbReleaseDate: kmdbMovie.releaseDate,
                kmdbPosterUrl: kmdbMovie.posterUrl,
                kmdbVodUrl: kmdbMovie.vodUrl,
              },
            });
          }

          if (!detail.title?.trim() && !kmdbMovie?.title?.trim()) {
            return null;
          }

          return {
            ...movie,
            // 상세 캐시의 원개봉일이 재개봉 예정일을 덮어쓰지 않게 함
            title: movie.title,
            releaseDate: movie.releaseDate,
            posterPath: detail.poster_path || kmdbMovie?.posterUrl || null,
            genres: (detail.genre_ids ?? [])
              .map((genreId) => genreNameById.get(genreId))
              .filter((genre): genre is string => Boolean(genre)),
          };
        } catch {
          const kmdbMovie = await this.findKmdbFallback(movie.title);

          if (!kmdbMovie) return null;

          return {
            ...movie,
            title: movie.title,
            releaseDate: movie.releaseDate,
            posterPath: kmdbMovie.posterUrl || null,
            genres: [],
          };
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
    const tmdbIds = upcomingMovies
      .map((movie) => movie.tmdbId)
      .filter((tmdbId): tmdbId is number => tmdbId !== null);

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
        genres: movie.genres,
        interestCount:
          movie.tmdbId === null ? 0 : (countMap.get(movie.tmdbId) ?? 0),
        isReleaseDateConfirmed: movie.isKobisBacked,
      }));

    return {
      items,
      total,
      hasNext: start + items.length < total,
    };
  }
}
