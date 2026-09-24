import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, format, isValid, parseISO } from 'date-fns';
import { kstDateKey, kstDayRange, toKstDate } from '../lib/date-kst';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UserMovieCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private validateDate(value: string, label: string) {
    if (!DATE_ONLY_PATTERN.test(value)) {
      throw new BadRequestException(`${label}는 YYYY-MM-DD 형식이어야 합니다.`);
    }

    const date = new Date(`${value}T12:00:00+09:00`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label}가 올바르지 않습니다.`);
    }
  }

  async getCalendar(userId: string, from: string, to: string) {
    this.validateDate(from, '시작 날짜');
    this.validateDate(to, '종료 날짜');
    const nextDate = format(addDays(parseISO(to), 1), 'yyyy-MM-dd');
    const releaseStart = toKstDate(new Date(`${from}T12:00:00+09:00`));

    const releaseEnd = toKstDate(new Date(`${nextDate}T12:00:00+09:00`));

    const [watchedRows, notificationRows] = await Promise.all([
      this.prisma.userMovie.findMany({
        where: {
          userId,
          kind: 'watched',
          watchedAt: {
            gte: kstDayRange(from).start,
            lt: kstDayRange(nextDate).start,
          },
        },
        select: {
          tmdbId: true,
          watchedAt: true,
          viewingPlace: true,
          rating: true,
          review: true,
        },
        orderBy: {
          watchedAt: 'asc',
        },
      }),
      this.prisma.movieReleaseNotification.findMany({
        where: {
          userId,
          enabled: true,
          releaseDate: {
            gte: releaseStart,
            lt: releaseEnd,
          },
        },
        select: {
          tmdbId: true,
          releaseDate: true,
        },
        orderBy: {
          releaseDate: 'asc',
        },
      }),
    ]);
    const tmdbIds = [
      ...new Set([
        ...watchedRows.map((row) => row.tmdbId),
        ...notificationRows.map((row) => row.tmdbId),
      ]),
    ];
    const movies = await this.prisma.moviePool.findMany({
      where: {
        tmdbId: {
          in: tmdbIds,
        },
      },
      select: {
        tmdbId: true,
        title: true,
        posterPath: true,
      },
    });
    const movieById = new Map(movies.map((movie) => [movie.tmdbId, movie]));
    return {
      from,
      to,
      watched: watchedRows.flatMap((row) => {
        if (!row.watchedAt) return [];
        const movie = movieById.get(row.tmdbId);
        if (!movie) return [];
        return [
          {
            tmdbId: row.tmdbId,
            date: kstDateKey(row.watchedAt),
            title: movie.title,
            posterPath: movie.posterPath,
            watchedAt: row.watchedAt,
            viewingPlace: row.viewingPlace,
            rating: row.rating,
            review: row.review,
          },
        ];
      }),
      releaseNotifications: notificationRows.flatMap((row) => {
        const movie = movieById.get(row.tmdbId);
        if (!movie) return [];

        return [
          {
            tmdbId: row.tmdbId,
            date: kstDateKey(row.releaseDate),
            title: movie.title,
            posterPath: movie.posterPath,
          },
        ];
      }),
    };
  }
}
