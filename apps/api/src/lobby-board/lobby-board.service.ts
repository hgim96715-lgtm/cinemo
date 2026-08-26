import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LobbyBoardResponse } from '@cinemo/shared';
import {
  kstPreviousWeekRange,
  kstTodayRange,
  kstWeekRange,
  todayKstDate,
} from '../lib/date-kst';
import { TmdbService } from '../tmdb/tmdb.service';
import { AdminService } from '../admin/admin.service';

const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class LobbyBoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly adminService: AdminService,
  ) {}

  private countByTime(
    times: Date[],
    start: Date,
    slotMs: number,
    slotCount: number,
  ): number[] {
    const series = Array.from({ length: slotCount }, () => 0);
    const startMs = start.getTime();
    for (const time of times) {
      const i = Math.floor((time.getTime() - startMs) / slotMs);
      if (i >= 0 && i < slotCount) series[i] += 1;
    }
    return series;
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
    const today = kstTodayRange();
    const week = kstWeekRange();
    const visitDate = todayKstDate();

    const [reviewTimes, visitTimes, weekTopMovies, todayVisits] =
      await Promise.all([
        this.prisma.reviewPost.findMany({
          where: { createdAt: { gte: today.start, lt: today.end } },
          select: { createdAt: true },
        }),
        this.prisma.lobbyVisit.findMany({
          where: { visitDate },
          select: { visitedAt: true },
        }),
        this.weekTopMovies(week.start, week.end),
        this.prisma.lobbyVisit.count({ where: { visitDate } }),
      ]);

    const todayReviewSeries = this.countByTime(
      reviewTimes.map((r) => r.createdAt),
      today.start,
      4 * HOUR_MS,
      6,
    );
    const todayVisitSeries = this.countByTime(
      visitTimes.map((v) => v.visitedAt),
      today.start,
      4 * HOUR_MS,
      6,
    );

    return {
      todayVisits,
      todayVisitSeries,
      todayReviewCount: todayReviewSeries.reduce((a, b) => a + b, 0),
      todayReviewSeries,
      weekReviewCount: weekTopMovies.reduce((a, m) => a + m.count, 0),
      weekTopMovies,
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
}
