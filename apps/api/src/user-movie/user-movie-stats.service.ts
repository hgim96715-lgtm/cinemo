import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { kstDateKey, kstDayRange, kstMonthRange } from '../lib/date-kst';

@Injectable()
export class UserMovieStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, year: number) {
    const start = kstMonthRange(year, 1).start;
    const end = kstDayRange(`${year + 1}-01-01`).start;

    const rows = await this.prisma.userMovie.findMany({
      where: { userId, kind: 'watched', watchedAt: { gte: start, lt: end } },
      select: { watchedAt: true },
    });

    const monthly = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      count: 0,
    }));

    for (const row of rows) {
      if (!row.watchedAt) continue;

      const month = Number(kstDateKey(row.watchedAt).slice(5, 7));
      monthly[month - 1].count += 1;
    }

    return { year, total: rows.length, monthly };
  }
}
