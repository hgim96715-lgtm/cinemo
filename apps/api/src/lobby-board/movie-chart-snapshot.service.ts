import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toKstDate } from '../lib/date-kst';

type MovieChartSnapshotInput = {
  kobisMovieCd: string;
  tmdbId?: number | null;
  rank: number;
  title: string;
  dailyAudienceCount: number;
  audienceCount: number;
};

type MovieChartStatAccumulator = {
  kobisMovieCd: string;
  title: string;
  firstRank: number;
  lastRank: number;
  bestRank: number;
  firstAudienceCount: number;
  lastAudienceCount: number;
  dailyAudienceTotal: number;
  rankSampleCount: number;
};

@Injectable()
export class MovieChartSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async saveDailysnapshot(
    targetDate: string,
    movies: MovieChartSnapshotInput[],
  ) {
    const chartDate = toKstDate(new Date(`${targetDate}T00:00:00+09:00`));

    return this.prisma.$transaction(
      movies.map((movie) =>
        this.prisma.movieChartSnapshot.upsert({
          where: {
            chartDate_kobisMovieCd: {
              chartDate,
              kobisMovieCd: movie.kobisMovieCd,
            },
          },
          create: {
            chartDate,
            kobisMovieCd: movie.kobisMovieCd,
            tmdbId: movie.tmdbId ?? null,
            rank: movie.rank,
            title: movie.title,
            dailyAudienceCount: movie.dailyAudienceCount,
            audienceCount: movie.audienceCount,
          },
          update: {
            tmdbId: movie.tmdbId ?? null,
            rank: movie.rank,
            title: movie.title,
            dailyAudienceCount: movie.dailyAudienceCount,
            audienceCount: movie.audienceCount,
          },
        }),
      ),
    );
  }

  async getSnapshots(fromDate: string, toDate: string) {
    // DB 연결 실패를 빈 차트 이력으로 오인하지 않도록 조회 전에 확인한다.
    await this.prisma.$queryRaw`SELECT 1`;

    const from = toKstDate(new Date(`${fromDate}T00:00:00+09:00`));
    const to = toKstDate(new Date(`${toDate}T00:00:00+09:00`));

    return this.prisma.movieChartSnapshot.findMany({
      where: {
        chartDate: { gte: from, lte: to },
      },
      orderBy: [{ chartDate: 'asc' }, { rank: 'asc' }],
    });
  }

  async getStats(fromDate: string, toDate: string) {
    const snapshots = await this.getSnapshots(fromDate, toDate);

    const stats = new Map<string, MovieChartStatAccumulator>();

    for (const snapshot of snapshots) {
      const current = stats.get(snapshot.kobisMovieCd);
      if (!current) {
        stats.set(snapshot.kobisMovieCd, {
          kobisMovieCd: snapshot.kobisMovieCd,
          title: snapshot.title,
          firstRank: snapshot.rank,
          lastRank: snapshot.rank,
          bestRank: snapshot.rank,
          firstAudienceCount: snapshot.audienceCount,
          lastAudienceCount: snapshot.audienceCount,
          dailyAudienceTotal: snapshot.dailyAudienceCount,
          rankSampleCount: 1,
        });
        continue;
      }

      current.lastRank = snapshot.rank;
      current.bestRank = Math.min(current.bestRank, snapshot.rank);
      current.lastAudienceCount = snapshot.audienceCount;
      current.dailyAudienceTotal += snapshot.dailyAudienceCount;
      current.rankSampleCount += 1;
    }
    return {
      from: fromDate,
      to: toDate,
      items: [...stats.values()]
        .map((stat) => ({
          kobisMovieCd: stat.kobisMovieCd,
          title: stat.title,
          audienceCount: stat.lastAudienceCount,
          audienceChange: stat.lastAudienceCount - stat.firstAudienceCount,
          dailyAudienceTotal: stat.dailyAudienceTotal,
          bestRank: stat.bestRank,
          lastRank: stat.lastRank,
          rankChange: stat.firstRank - stat.lastRank,
          rankSampleCount: stat.rankSampleCount,
        }))
        .sort((a, b) => a.bestRank - b.bestRank),
    };
  }
}
