import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardBoxOfficeMovie, LobbyBoardResponse } from '@cinemo/shared';
import {
  kstDateKey,
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
      boxOfficeMovies,
      upcomingInterestMovies,
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
          movie.release_date >= fromDate &&
          movie.release_date <= untilDate &&
          hasKoreanTitle(movie.title) &&
          Boolean(movie.poster_path) &&
          movie.release_date !== '',
      )
      .sort((a, b) => a.release_date.localeCompare(b.release_date));

    const pooledMovies = await this.prisma.moviePool.findMany({
      where: {
        releaseDate: { gte: fromDate, lte: untilDate },
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
      movies.map((movie) => [
        movie.id,
        {
          tmdbId: movie.id,
          title: movie.title,
          releaseDate: movie.release_date,
          posterPath: movie.poster_path,
        },
      ]),
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

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 30);
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
