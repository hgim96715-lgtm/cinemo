import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { UpdateDisplayDto } from './dto/update-display.dto';

@Injectable()
export class UserMovieDisplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

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
          data: { isDisplayed: false, wallSlot: null },
        });

        await tx.userMovie.updateMany({
          where: {
            userId,
            kind: 'watched',
            tmdbId: dto.tmdbId,
            isDisplayed: true,
            id: { not: userMovie.id },
          },
          data: { isDisplayed: false, wallSlot: null },
        });
      }

      return tx.userMovie.update({
        where: { id: userMovie.id },
        data: {
          isDisplayed: dto.isDisplayed,
          wallSlot: dto.isDisplayed ? dto.wallSlot : null,
        },
        select: {
          tmdbId: true,
          kind: true,
          isDisplayed: true,
          wallSlot: true,
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
      orderBy: { wallSlot: 'asc' },
      select: { tmdbId: true, wallSlot: true },
    });

    const items = await Promise.all(
      rows.map(async (row) => ({
        tmdbId: row.tmdbId,
        wallSlot: row.wallSlot,
        movie: await this.tmdbService.getMovieCached(row.tmdbId),
      })),
    );

    return { items };
  }
}
