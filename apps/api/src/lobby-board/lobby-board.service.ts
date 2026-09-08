import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardBoxOfficeMovie, LobbyBoardResponse } from '@cinemo/shared';
import {
  kstDateKey,
  kstPreviousWeekRange,
  kstWeekRange,
  todayKstDate,
} from '../lib/date-kst';
import { TmdbService } from '../tmdb/tmdb.service';
import { AdminService } from '../admin/admin.service';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../config/env.keys';

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

  private async getBoxOfficeMovies(): Promise<BoardBoxOfficeMovie[]> {
    const KOBIS_DAILY_BOX_OFFICE_URL =
      'https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json';

    const apikey = this.configService
      .get<string>(EnvKeys.KOBIS_API_KEY)
      ?.trim();

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
          posterPath: true,
        },
      });

      const posterMap = new Map(
        moviePool.map((movie) => [movie.title, movie.posterPath]),
      );

      const movies = list.slice(0, 5).map((movie) => ({
        rank: Number(movie.rank),
        title: movie.movieNm,
        audienceCount: Number(movie.audiAcc),
        rankChange:
          movie.rankOldAndNew === 'NEW' ? null : Number(movie.rankInten) || 0,
        posterPath: posterMap.get(movie.movieNm) ?? null,
      }));

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

  private async weekTopMovies(start: Date, end: Date) {
    const rows = await this.prisma.reviewPost.groupBy({
      by: ['tmdbId'],
      where: { createdAt: { gte: start, lt: end } },
      _count: { tmdbId: true },
      orderBy: { _count: { tmdbId: 'desc' } },
      take: 3,
    });

    const cachedMovies = await this.prisma.moviePool.findMany({
      where: { tmdbId: { in: rows.map((row) => row.tmdbId) } },
      select: { tmdbId: true, title: true },
    });

    const titleMap = new Map(
      cachedMovies.map((movie) => [movie.tmdbId, movie.title]),
    );

    return Promise.all(
      rows.map(async (row) => {
        const cachedTitle = titleMap.get(row.tmdbId);

        const title =
          cachedTitle && !cachedTitle.includes('정보를 찾을 수 없습니다.')
            ? cachedTitle
            : (await this.tmdbService.getMovieCached(row.tmdbId)).title;

        return {
          tmdbId: row.tmdbId,
          title,
          count: row._count.tmdbId,
        };
      }),
    );
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
    const week = kstWeekRange();

    const [weekTopMovies, upcomingMovies, boxOfficeMovies] = await Promise.all([
      this.weekTopMovies(week.start, week.end),
      this.getUpcomingMovies(),
      this.getBoxOfficeMovies(),
    ]);

    const upcomingInterestMovies = upcomingMovies
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

    const weekReviewCount = weekTopMovies.reduce(
      (total, movie) => total + movie.count,
      0,
    );

    return {
      weekReviewCount,
      weekTopMovies,
      boxOfficeMovies,
      upcomingInterestMovies,
    };
  }

  async getWeeklyRevealWinner() {
    const { start, end } = kstPreviousWeekRange();
    const [winner] = await this.weekTopMovies(start, end);
    if (!winner) return null;

    const sample = await this.prisma.reviewPost.findFirst({
      where: { tmdbId: winner.tmdbId, createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'desc' },
      select: { body: true },
    });
    return {
      ...winner,
      sampleBody: sample?.body ?? null,
      movie: await this.tmdbService.getMovieCached(winner.tmdbId),
    };
  }

  async getUpcomingMovies() {
    const today = kstDateKey();
    const oneYearLater = new Date(`${today}T00:00:00+09:00`);
    oneYearLater.setUTCDate(oneYearLater.getUTCDate() + 365);
    const until = oneYearLater.toISOString().slice(0, 10);
    const filters = {
      region: 'KR',
      'release_date.gte': today,
      'release_date.lte': until,
      with_release_type: '2|3',
    };

    const hasKoreanTitle = (title: string) =>
      title.trim() !== '' &&
      !title.includes('정보가 없습니다.') &&
      /[\uAC00-\uD7A3]/.test(title);

    const responses = await Promise.all(
      [1, 2, 3].map((page) =>
        this.tmdbService.discoverMovies(filters, page, 'ko-KR'),
      ),
    );

    const movies = responses
      .flatMap((response) => response.results)
      .filter(
        (movie) =>
          movie.release_date >= today &&
          movie.release_date <= until &&
          hasKoreanTitle(movie.title) &&
          Boolean(movie.poster_path) &&
          movie.release_date !== '',
      )
      .sort((a, b) => a.release_date.localeCompare(b.release_date));

    const pooledMovies = await this.prisma.moviePool.findMany({
      where: {
        releaseDate: { gte: today, lte: until },
        title: { not: '' },
        posterPath: { not: null },
      },
      select: {
        tmdbId: true,
        title: true,
        releaseDate: true,
        posterPath: true,
      },
    });

    const movieMap = new Map(
      movies.map((movie) => [movie.id, {
        tmdbId: movie.id,
        title: movie.title,
        releaseDate: movie.release_date,
        posterPath: movie.poster_path,
      }]),
    );

    for (const movie of pooledMovies) {
      if (!hasKoreanTitle(movie.title) || !movie.posterPath) continue;
      if (!movieMap.has(movie.tmdbId)) {
        movieMap.set(movie.tmdbId, movie);
      }
    }

    const upcomingMovies = [...movieMap.values()].sort((a, b) =>
      a.releaseDate.localeCompare(b.releaseDate),
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

    return upcomingMovies.map((movie) => ({
      tmdbId: movie.tmdbId,
      title: movie.title,
      releaseDate: movie.releaseDate,
      posterPath: movie.posterPath,
      interestCount: countMap.get(movie.tmdbId) ?? 0,
    }));
  }
}
