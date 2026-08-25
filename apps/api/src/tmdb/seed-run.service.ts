import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SeedRunTrigger = 'cron' | 'manual';

export type SeedRunStats = {
  processedPages?: number;
  fetchedCount?: number;
  savedCount?: number;
  skippedCount?: number;
  failedCount?: number;
};

export type SeedRunResult = {
  ok: boolean;
  processedPages: number;
  fetchedCount: number;
  savedCount: number;
  skippedCount: number;
  failedCount: number;
};

@Injectable()
export class SeedRunService {
  constructor(private readonly prisma: PrismaService) {}

  async start(trigger: SeedRunTrigger, pages: number, machineCount: number) {
    return this.prisma.moviePoolSeedRun.create({
      data: {
        trigger,
        pages,
        machineCount,
        status: 'running',
      },
    });
  }

  async updateProgress(id: string, stats: SeedRunStats) {
    return this.prisma.moviePoolSeedRun.update({
      where: { id },
      data: stats,
    });
  }

  async succeed(id: string, stats: SeedRunStats = {}) {
    return this.prisma.moviePoolSeedRun.update({
      where: { id },
      data: {
        ...stats,
        status: 'succeeded',
        finishedAt: new Date(),
      },
    });
  }

  async fail(id: string, errorMessage: string, stats: SeedRunStats = {}) {
    return this.prisma.moviePoolSeedRun.update({
      where: { id },
      data: {
        ...stats,
        status: 'failed',
        errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  async partial(id: string, errorMessage: string, stats: SeedRunStats = {}) {
    return this.prisma.moviePoolSeedRun.update({
      where: { id },
      data: {
        ...stats,
        status: 'partial',
        errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  async execute<T extends Record<string, SeedRunResult>>(
    trigger: SeedRunTrigger,
    pages: number,
    machineCount: number,
    task: () => Promise<T>,
  ): Promise<T> {
    const run = await this.start(trigger, pages, machineCount);
    try {
      const result = await task();
      const values = Object.values(result);
      const stats = values.reduce(
        (total, current) => ({
          processedPages: total.processedPages + current.processedPages,
          fetchedCount: total.fetchedCount + current.fetchedCount,
          savedCount: total.savedCount + current.savedCount,
          skippedCount: total.skippedCount + current.skippedCount,
          failedCount: total.failedCount + current.failedCount,
        }),
        {
          processedPages: 0,
          fetchedCount: 0,
          savedCount: 0,
          skippedCount: 0,
          failedCount: 0,
        },
      );
      if (values.some((result) => !result.ok)) {
        await this.partial(run.id, '일부 영화 저장에 실패했습니다.', stats);
      } else {
        await this.succeed(run.id, stats);
      }
      return result;
    } catch (error) {
      await this.fail(
        run.id,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async executeSingle(
    trigger: SeedRunTrigger,
    pages: number,
    machineCount: number,
    task: () => Promise<SeedRunResult>,
  ): Promise<SeedRunResult> {
    const run = await this.start(trigger, pages, machineCount);
    try {
      const result = await task();
      const stats = {
        processedPages: result.processedPages,
        fetchedCount: result.fetchedCount,
        savedCount: result.savedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
      };
      if (!result.ok) {
        await this.partial(run.id, '일부 영화 저장에 실패했습니다.', stats);
      } else {
        await this.succeed(run.id, stats);
      }
      return result;
    } catch (error) {
      await this.fail(
        run.id,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async getLatest() {
    return this.prisma.moviePoolSeedRun.findFirst({
      orderBy: {
        startedAt: 'desc',
      },
    });
  }
}
