import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  UserMovieKind,
  UserMovieViewingType,
} from '@cinemo/shared';
import { kstDateKey } from '../lib/date-kst';
import { UpdateViewingDetailsDto } from './dto/update-viewing-details.dto';
import { TmdbService } from '../tmdb/tmdb.service';
import type { UserMovieRecordResponseDto } from './dto/user-movie-record-response.dto';

const USER_MOVIE_RECORD_SELECT = {
  tmdbId: true,
  kind: true,
  watchedAt: true,
  viewingType: true,
  viewingTypeCustom: true,
  viewingPlatform: true,
  viewingPlace: true,
  cinemaId: true,
  review: true,
  rating: true,
} as const;

@Injectable()
export class UserMovieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

  private toRecordResponse(row: {
    tmdbId: number;
    kind: UserMovieKind;
    watchedAt: Date | null;
    viewingType: UserMovieViewingType | null;
    viewingTypeCustom: string | null;
    viewingPlatform: string | null;
    viewingPlace: string | null;
    cinemaId: string | null;
    review: string | null;
    rating: number | null;
  }): UserMovieRecordResponseDto {
    return {
      tmdbId: row.tmdbId,
      kind: row.kind,
      watchedAt: row.watchedAt?.toISOString() ?? null,
      viewingType: row.viewingType,
      viewingTypeCustom: row.viewingTypeCustom,
      viewingPlatform: row.viewingPlatform,
      viewingPlace: row.viewingPlace,
      cinemaId: row.cinemaId,
      review: row.review,
      rating: row.rating,
    };
  }

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

  async addWatchedMovie(
    userId: string,
    tmdbId: number,
    watchedAt: string,
  ): Promise<UserMovieRecordResponseDto> {
    const watchedDate = this.parseWatchedDate(watchedAt);

    const row = await this.prisma.userMovie.upsert({
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
      select: USER_MOVIE_RECORD_SELECT,
    });

    return this.toRecordResponse(row);
  }

  async updateWatchedAt(
    userId: string,
    tmdbId: number,
    watchedAt: string,
  ): Promise<UserMovieRecordResponseDto> {
    const watchedDate = this.parseWatchedDate(watchedAt);
    const existing = await this.prisma.userMovie.findUnique({
      where: { userId_tmdbId_kind: { userId, tmdbId, kind: 'watched' } },
    });
    if (!existing) throw new NotFoundException('관람 기록을 찾을 수 없습니다.');

    const row = await this.prisma.userMovie.update({
      where: { id: existing.id },
      data: { watchedAt: watchedDate },
      select: USER_MOVIE_RECORD_SELECT,
    });

    return this.toRecordResponse(row);
  }

  async removeWatchedMovie(userId: string, tmdbId: number) {
    const existing = await this.prisma.userMovie.findUnique({
      where: { userId_tmdbId_kind: { userId, tmdbId, kind: 'watched' } },
    });
    if (!existing) throw new NotFoundException('관람 기록을 찾을 수 없습니다.');

    await this.prisma.userMovie.delete({ where: { id: existing.id } });

    return { tmdbId, kind: 'watched', active: false };
  }

  async updateViewingDetails(
    userId: string,
    dto: UpdateViewingDetailsDto,
  ): Promise<UserMovieRecordResponseDto> {
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

    const row = await this.prisma.userMovie.update({
      where: { id: existing.id },
      data: {
        ...(watchedDate !== undefined ? { watchedAt: watchedDate } : {}),
        ...(dto.viewingType !== undefined
          ? {
              viewingType: dto.viewingType,
              viewingTypeCustom:
                dto.viewingType === 'other'
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
        ...(dto.viewingPlace !== undefined
          ? { viewingPlace: dto.viewingPlace?.trim() || null }
          : {}),
        ...(dto.cinemaId !== undefined
          ? { cinemaId: dto.cinemaId || null }
          : {}),
        ...(dto.review !== undefined
          ? { review: dto.review?.trim() || null }
          : {}),
        ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      },
      select: USER_MOVIE_RECORD_SELECT,
    });

    return this.toRecordResponse(row);
  }

  async getMovieStatus(userId: string, tmdbId: number) {
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

  async getCounts(userId: string) {
    const [wish, watched] = await Promise.all([
      this.prisma.userMovie.count({ where: { userId, kind: 'wish' } }),
      this.prisma.userMovie.count({ where: { userId, kind: 'watched' } }),
    ]);
    return { wish, watched };
  }

  async listByKind(
    userId: string,
    kind: UserMovieKind,
    take = 9,
    cursor?: string,
  ) {
    const safeTake = Math.min(Math.max(take, 1), 30);

    const rows = await this.prisma.userMovie.findMany({
      where: { userId, kind },
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      take: safeTake + 1,
      orderBy:
        kind === 'watched'
          ? [
              { watchedAt: { sort: 'desc', nulls: 'last' } },
              { updatedAt: 'desc' },
            ]
          : { updatedAt: 'desc' },
      select: {
        id: true,
        tmdbId: true,
        updatedAt: true,
        watchedAt: true,
        viewingType: true,
        viewingTypeCustom: true,
        viewingPlatform: true,
        viewingPlace: true,
        cinemaId: true,
        review: true,
        rating: true,
      },
    });
    const hasNext = rows.length > safeTake;
    const pageRows = rows.slice(0, safeTake);

    const items = await Promise.all(
      pageRows.map(async (row) => ({
        tmdbId: row.tmdbId,
        updatedAt: row.updatedAt.toISOString(),
        watchedAt: row.watchedAt?.toISOString() ?? null,
        viewingType: row.viewingType,
        viewingTypeCustom: row.viewingTypeCustom,
        viewingPlatform: row.viewingPlatform,
        viewingPlace: row.viewingPlace,
        cinemaId: row.cinemaId,
        review: row.review,
        rating: row.rating,
        movie: await this.tmdbService.getMovieCached(row.tmdbId),
      })),
    );
    return {
      items,
      hasNext,
      nextCursor: hasNext ? (pageRows.at(-1)?.id ?? null) : null,
    };
  }

  async getWishMovieDetail(userId: string, tmdbId: number) {
    const wish = await this.prisma.userMovie.findUnique({
      where: {
        userId_tmdbId_kind: { userId, tmdbId, kind: 'wish' },
      },
    });
    if (!wish) {
      throw new NotFoundException('보고 싶은 영화를 찾을 수 없습니다.');
    }
    const movie = await this.tmdbService.getMovie(tmdbId);
    return {
      genre_ids: movie.genre_ids,
      firstReleaseDate: movie.firstReleaseDate ?? null,
      reReleaseDates: movie.reReleaseDates ?? [],
    };
  }
}
