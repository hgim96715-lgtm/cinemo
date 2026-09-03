import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserMovieKind,
  UserMovieViewingType,
} from '../generated/prisma/enums';
import { TmdbService } from '../tmdb/tmdb.service';
import { UpdateDisplayDto } from './dto/update-display.dto';
import { kstDateKey, kstDayRange, kstMonthRange } from '../lib/date-kst';
import { UpdateViewingDetailsDto } from './dto/update-viewing-details.dto';

type UserMovieListFilters = {
  search?: string;
  year?: number;
  month?: number;
};

@Injectable()
export class UserMovieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

  private parseWatchedDate(watchedAt: string) {
    const watchedDate = new Date(`${watchedAt}T12:00:00+09:00`);

    if (Number.isNaN(watchedDate.getTime())) {
      throw new BadRequestException('관람일이 올바르지 않습니다.');
    }

    if (watchedAt > kstDateKey()) {
      throw new BadRequestException(
        '관람일은 오늘 또는 이전 날짜만 선택할 수 있습니다.',
      );
    }

    return watchedDate;
  }

  // active true: 영화 추가, false: 영화 삭제
  async toggle(userId: string, tmdbId: number, kind: 'wish' | 'watched') {
    const existing = await this.prisma.userMovie.findUnique({
      where: {
        userId_tmdbId_kind: { userId, tmdbId, kind },
      },
    });
    if (existing) {
      await this.prisma.userMovie.delete({ where: { id: existing.id } });
      return { tmdbId, kind, active: false };
    }
    await this.prisma.userMovie.create({
      data: {
        userId,
        tmdbId,
        kind,
        watchedAt: kind === 'watched' ? new Date() : null,
      },
    });
    return { tmdbId, kind, active: true };
  }

  async addWatchedMovie(userId: string, tmdbId: number, watchedAt: string) {
    const watchedDate = this.parseWatchedDate(watchedAt);

    return this.prisma.userMovie.upsert({
      where: {
        userId_tmdbId_kind: {
          userId,
          tmdbId,
          kind: 'watched',
        },
      },
      create: {
        userId,
        tmdbId,
        kind: 'watched',
        watchedAt: watchedDate,
      },
      update: {
        watchedAt: watchedDate,
      },
    });
  }

  async updateWatchedAt(userId: string, tmdbId: number, watchedAt: string) {
    const watchedDate = this.parseWatchedDate(watchedAt);
    const existing = await this.prisma.userMovie.findUnique({
      where: { userId_tmdbId_kind: { userId, tmdbId, kind: 'watched' } },
    });
    if (!existing) throw new NotFoundException('관람 기록을 찾을 수 없습니다.');

    return this.prisma.userMovie.update({
      where: { id: existing.id },
      data: { watchedAt: watchedDate },
    });
  }

  async removeWatchedMovie(userId: string, tmdbId: number) {
    const existing = await this.prisma.userMovie.findUnique({
      where: { userId_tmdbId_kind: { userId, tmdbId, kind: 'watched' } },
    });
    if (!existing) throw new NotFoundException('관람 기록을 찾을 수 없습니다.');

    await this.prisma.userMovie.delete({ where: { id: existing.id } });

    return { tmdbId, kind: 'watched', active: false };
  }

  async updateViewingDetails(userId: string, dto: UpdateViewingDetailsDto) {
    const existing = await this.prisma.userMovie.findUnique({
      where: {
        userId_tmdbId_kind: {
          userId,
          tmdbId: dto.tmdbId,
          kind: 'watched',
        },
      },
    });
    if (!existing) throw new NotFoundException('관람 기록을 찾을 수 없습니다.');

    let watchedDate: Date | null | undefined;
    if (dto.watchedAt !== undefined) {
      watchedDate = dto.watchedAt ? this.parseWatchedDate(dto.watchedAt) : null;
    }

    return this.prisma.userMovie.update({
      where: { id: existing.id },
      data: {
        ...(watchedDate !== undefined ? { watchedAt: watchedDate } : {}),
        ...(dto.viewingType !== undefined
          ? {
              viewingType: dto.viewingType,
              viewingTypeCustom:
                dto.viewingType === UserMovieViewingType.other
                  ? dto.viewingTypeCustom?.trim() || null
                  : null,
            }
          : {}),
        ...(dto.viewingType === undefined && dto.viewingTypeCustom !== undefined
          ? {
              viewingTypeCustom: dto.viewingTypeCustom?.trim() || null,
            }
          : {}),
        ...(dto.viewingPlatform !== undefined
          ? { viewingPlatform: dto.viewingPlatform?.trim() || null }
          : {}),
        ...(dto.viewingLocation !== undefined
          ? { viewingLocation: dto.viewingLocation?.trim() || null }
          : {}),
        ...(dto.review !== undefined
          ? { review: dto.review?.trim() || null }
          : {}),
        ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      },
    });
  }

  async getMarks(userId: string, tmdbId: number) {
    const rows = await this.prisma.userMovie.findMany({
      where: { userId, tmdbId },
      select: { kind: true },
    });
    return {
      tmdbId,
      wish: rows.some((row) => row.kind === 'wish'),
      watched: rows.some((row) => row.kind === 'watched'),
    };
  }

  async listByKind(
    userId: string,
    kind: UserMovieKind,
    page = 1,
    limit = 24,
    filters: UserMovieListFilters = {},
  ) {
    const take = Math.min(Math.max(limit, 1), 48);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * take;
    const search = filters.search?.trim().toLocaleLowerCase();
    const monthOnly =
      kind === 'watched' && !filters.year && Boolean(filters.month);
    const needsInMemoryFilter = Boolean(search) || monthOnly;
    const watchedAt =
      kind === 'watched' && filters.year
        ? filters.month
          ? (() => {
              const { start, end } = kstMonthRange(
                filters.year!,
                filters.month,
              );
              return { gte: start, lt: end };
            })()
          : {
              gte: kstMonthRange(filters.year, 1).start,
              lt: kstDayRange(`${filters.year + 1}-01-01`).start,
            }
        : undefined;
    const where = {
      userId,
      kind,
      ...(watchedAt ? { watchedAt } : {}),
    };

    const rows = await this.prisma.userMovie.findMany({
      where,
      orderBy:
        kind === 'watched'
          ? [
              { watchedAt: { sort: 'desc', nulls: 'last' } },
              { updatedAt: 'desc' },
            ]
          : { updatedAt: 'desc' },
      ...(needsInMemoryFilter ? {} : { skip, take }),
      select: {
        tmdbId: true,
        updatedAt: true,
        watchedAt: true,
        viewingType: true,
        viewingTypeCustom: true,
        viewingPlatform: true,
        viewingLocation: true,
        review: true,
        rating: true,
      },
    });

    const items = await Promise.all(
      rows.map(async (row) => ({
        tmdbId: row.tmdbId,
        updatedAt: row.updatedAt.toISOString(),
        watchedAt: row.watchedAt?.toISOString() ?? null,
        viewingType: row.viewingType,
        viewingTypeCustom: row.viewingTypeCustom,
        viewingPlatform: row.viewingPlatform,
        viewingLocation: row.viewingLocation,
        movie: await this.tmdbService.getMovieCached(row.tmdbId),
        review: row.review,
        rating: row.rating,
      })),
    );

    const filteredItems = needsInMemoryFilter
      ? items.filter(({ watchedAt, movie }) => {
          const monthMatches = monthOnly
            ? watchedAt !== null &&
              kstDateKey(new Date(watchedAt)).slice(5, 7) ===
                String(filters.month).padStart(2, '0')
            : true;
          const searchMatches = search
            ? [movie.title, movie.director, movie.release_date].some((value) =>
                value?.toLocaleLowerCase().includes(search),
              )
            : true;

          return monthMatches && searchMatches;
        })
      : items;
    const total = needsInMemoryFilter
      ? filteredItems.length
      : await this.prisma.userMovie.count({ where });
    const pagedItems = needsInMemoryFilter
      ? filteredItems.slice(skip, skip + take)
      : filteredItems;

    return {
      items: pagedItems,
      page: safePage,
      total,
      hasMore: skip + pagedItems.length < total,
    };
  }

  async getCounts(userId: string) {
    const [wish, watched] = await Promise.all([
      this.prisma.userMovie.count({ where: { userId, kind: 'wish' } }),
      this.prisma.userMovie.count({ where: { userId, kind: 'watched' } }),
    ]);
    return { wish, watched };
  }

  async getCalendar(userId: string, year: number, month: number) {
    const { start, end } = kstMonthRange(year, month);

    const rows = await this.prisma.userMovie.findMany({
      where: {
        userId,
        kind: 'watched',
        watchedAt: { gte: start, lt: end },
      },
      orderBy: { watchedAt: 'asc' },
      select: { tmdbId: true, watchedAt: true },
    });

    const items = await Promise.all(
      rows.map(async (row) => ({
        tmdbId: row.tmdbId,
        date: kstDateKey(row.watchedAt!),
        watchedAt: row.watchedAt!.toISOString(),
        movie: await this.tmdbService.getMovieCached(row.tmdbId),
      })),
    );
    return { year, month, items };
  }

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

  async updateDisplay(userId: string, dto: UpdateDisplayDto) {
    return this.prisma.$transaction(async (tx) => {
      const userMovie = await tx.userMovie.upsert({
        where: {
          userId_tmdbId_kind: {
            userId,
            tmdbId: dto.tmdbId,
            kind: 'watched',
          },
        },
        create: {
          userId,
          tmdbId: dto.tmdbId,
          kind: 'watched',
          watchedAt: new Date(),
        },
        update: {},
      });

      if (dto.isDisplayed) {
        await tx.userMovie.updateMany({
          where: {
            userId,
            kind: 'watched',
            isDisplayed: true,
            wallSlot: dto.wallSlot,
            id: { not: userMovie.id },
          },
          data: {
            isDisplayed: false,
            wallSlot: null,
            displayOrder: null,
          },
        });

        await tx.userMovie.updateMany({
          where: {
            userId,
            kind: 'watched',
            tmdbId: dto.tmdbId,
            isDisplayed: true,
            id: { not: userMovie.id },
          },
          data: {
            isDisplayed: false,
            wallSlot: null,
            displayOrder: null,
          },
        });
      }

      return tx.userMovie.update({
        where: { id: userMovie.id },
        data: {
          isDisplayed: dto.isDisplayed,
          wallSlot: dto.isDisplayed ? dto.wallSlot : null,
          displayOrder: dto.isDisplayed ? dto.wallSlot : null,
        },
        select: {
          tmdbId: true,
          kind: true,
          isDisplayed: true,
          wallSlot: true,
          displayOrder: true,
        },
      });
    });
  }

  async listDisplayed(userId: string) {
    const rows = await this.prisma.userMovie.findMany({
      where: {
        userId,
        kind: 'watched',
        isDisplayed: true,
        wallSlot: { not: null },
      },
      orderBy: [{ wallSlot: 'asc' }, { displayOrder: 'asc' }],
      select: {
        tmdbId: true,
        wallSlot: true,
        displayOrder: true,
      },
    });
    const items = await Promise.all(
      rows.map(async (row) => ({
        tmdbId: row.tmdbId,
        wallSlot: row.wallSlot,
        displayOrder: row.displayOrder,
        movie: await this.tmdbService.getMovieCached(row.tmdbId),
      })),
    );
    return { items };
  }
}
