import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  AdminAnalytics,
  AdminOverview,
  AdminPeople,
  AdminPeopleFeed,
  AdminPeopleFeedItem,
  CafeTableId,
  CafeTableSnapshot,
} from '@cinemo/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  kstDateKey,
  kstDayKeys,
  kstDayRange,
  kstHour,
  kstTodayRange,
  kstWeekRange,
  todayKstDate,
  toKstDate,
} from '../lib/date-kst';

type CountField =
  | 'visits'
  | 'logins'
  | 'ticketsIssued'
  | 'ticketsUsed'
  | 'reviews'
  | 'cafeMessages';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async countIncrement(
    field: CountField,
    now = new Date(),
    userId?: string,
  ): Promise<void> {
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isTestAccount: true },
      });
      if (user?.isTestAccount) return;
    }

    const date = toKstDate(now);
    const hour = kstHour(now);

    const daily = this.prisma.adminDailyStat.upsert({
      where: { date },
      create: { date, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });

    const hourly =
      field === 'ticketsIssued' ||
      field === 'ticketsUsed' ||
      field === 'reviews'
        ? null
        : this.prisma.adminHourlyStat.upsert({
            where: { date_hour: { date, hour } },
            create: { date, hour, [field]: 1 },
            update: { [field]: { increment: 1 } },
          });
    await this.prisma.$transaction([daily, hourly].filter((q) => q !== null));
  }

  async recordGuestLogin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isTestAccount: true },
    });
    if (user?.isTestAccount) return;

    await this.prisma.adminLoginLog.create({ data: { userId } });
    await this.countIncrement('logins', new Date(), userId);
  }

  private isKstDayKey(value: string): boolean {
    return kstDateKey(new Date(`${value}T00:00:00+09:00`)) === value;
  }

  async getOverview(): Promise<AdminOverview> {
    const visitDate = todayKstDate();
    const today = kstTodayRange();
    const week = kstWeekRange();

    const [
      userCount,
      todaySignupCount,
      todayLogins,
      todayVisitCount,
      todayAnonReviewCount,
      weekSignupCount,
      weekLoginSum,
      weekVisitCount,
      weekAnonReviewCount,
      reviewCount,
      todayTicketIssuedCount,
      cafeSeatedCount,
      rows,
    ] = await Promise.all([
      this.prisma.user.count({ where: this.guestWhere() }),
      this.prisma.user.count({
        where: {
          ...this.guestWhere(),
          createdAt: { gte: today.start, lt: today.end },
        },
      }),
      this.prisma.adminDailyStat.findUnique({
        where: { date: visitDate },
        select: { logins: true },
      }),
      this.prisma.lobbyVisit.count({
        where: { visitDate, user: this.guestWhere() },
      }),
      this.prisma.anonVisit.count({
        where: { visitDate, place: 'review' },
      }),
      this.prisma.user.count({
        where: {
          ...this.guestWhere(),
          createdAt: { gte: week.start, lt: week.end },
        },
      }),
      this.prisma.adminDailyStat.aggregate({
        where: {
          date: {
            gte: toKstDate(week.start),
            lt: toKstDate(week.end),
          },
        },
        _sum: { logins: true },
      }),
      this.prisma.lobbyVisit.count({
        where: {
          user: this.guestWhere(),
          visitDate: {
            gte: toKstDate(week.start),
            lt: toKstDate(week.end),
          },
        },
      }),
      this.prisma.anonVisit.count({
        where: {
          place: 'review',
          visitDate: {
            gte: toKstDate(week.start),
            lt: toKstDate(week.end),
          },
        },
      }),
      this.prisma.reviewPost.count({
        where: {
          createdAt: { gte: today.start, lt: today.end },
          user: this.guestWhere(),
        },
      }),
      this.prisma.ticket.count({
        where: { ticketDate: visitDate, user: this.guestWhere() },
      }),
      this.prisma.cafeTableSeat.count({
        where: { user: this.guestWhere() },
      }),
      this.prisma.cafeTableSession.findMany({
        include: { _count: { select: { seats: true } } },
        orderBy: { tableId: 'asc' },
      }),
    ]);

    const tables: CafeTableSnapshot[] = rows.map((row) => ({
      tableId: row.tableId as CafeTableId,
      label: row.label,
      access: row.access,
      seatedCount: row._count.seats,
    }));

    return {
      userCount,
      todaySignupCount,
      todayLoginCount: todayLogins?.logins ?? 0,
      todayVisitCount,
      todayAnonReviewCount,
      weekSignupCount,
      weekLoginCount: weekLoginSum._sum.logins ?? 0,
      weekVisitCount,
      weekAnonReviewCount,
      reviewCount,
      todayTicketIssuedCount,
      cafeSeatedCount,
      tables,
    };
  }

  async getAnalytics(from?: string, to?: string): Promise<AdminAnalytics> {
    const end = to ?? kstDateKey();
    const start =
      from ??
      kstDateKey(new Date(kstDayRange(end).start.getTime() - 6 * 86400000));
    if (!this.isKstDayKey(start) || !this.isKstDayKey(end) || start > end) {
      throw new BadRequestException('날짜 범위를 확인해 주세요.');
    }

    const days = kstDayKeys(start, end);
    const fromDate = toKstDate(kstDayRange(start).start);
    const toDate = toKstDate(kstDayRange(end).start);

    const [dailyRows, hourlyRows, guestCreated] = await Promise.all([
      this.prisma.adminDailyStat.findMany({
        where: { date: { gte: fromDate, lte: toDate } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.adminHourlyStat.findMany({
        where: { date: { gte: fromDate, lte: toDate } },
        orderBy: [{ date: 'asc' }, { hour: 'asc' }],
      }),
      this.prisma.user.findMany({
        where: {
          ...this.guestWhere(),
          createdAt: {
            gte: kstDayRange(start).start,
            lt: kstDayRange(end).end,
          },
        },
        select: { createdAt: true },
      }),
    ]);

    const signupByDay = new Map<string, number>();
    for (const row of guestCreated) {
      const date = kstDateKey(row.createdAt);
      signupByDay.set(date, (signupByDay.get(date) ?? 0) + 1);
    }

    const dailyMap = new Map(
      dailyRows.map((row) => [kstDateKey(row.date), row]),
    );
    const series = days.map((date) => {
      const row = dailyMap.get(date);
      return {
        date,
        visits: row?.visits ?? 0,
        logins: row?.logins ?? 0,
        signups: signupByDay.get(date) ?? 0,
        ticketsIssued: row?.ticketsIssued ?? 0,
        ticketsUsed: row?.ticketsUsed ?? 0,
        reviews: row?.reviews ?? 0,
        cafeMessages: row?.cafeMessages ?? 0,
      };
    });

    const hours = hourlyRows.map((row) => ({
      date: kstDateKey(row.date),
      hour: row.hour,
      visits: row.visits,
      logins: row.logins,
      cafeMessages: row.cafeMessages,
    }));

    return { from: start, to: end, series, hours };
  }

  private guestWhere() {
    return { role: 'user' as const, isTestAccount: false };
  }

  async getPeopleFeed(skip = 0, take = 20): Promise<AdminPeopleFeed> {
    const week = kstWeekRange();
    const visitFrom = toKstDate(week.start);
    const visitTo = toKstDate(week.end);
    const cap = 400;

    const [visits, logins] = await Promise.all([
      this.prisma.lobbyVisit.findMany({
        where: {
          user: this.guestWhere(),
          visitDate: { gte: visitFrom, lt: visitTo },
        },
        orderBy: { visitedAt: 'desc' },
        take: cap,
        include: { user: { select: { nickname: true } } },
      }),
      this.prisma.adminLoginLog.findMany({
        where: {
          user: this.guestWhere(),
          loggedAt: { gte: week.start, lt: week.end },
        },
        orderBy: { loggedAt: 'desc' },
        take: cap,
        include: { user: { select: { nickname: true } } },
      }),
    ]);

    const merged: AdminPeopleFeedItem[] = [
      ...visits.map((row) => ({
        kind: 'visit' as const,
        nickname: row.user.nickname,
        at: row.visitedAt.toISOString(),
      })),
      ...logins.map((row) => ({
        kind: 'login' as const,
        nickname: row.user.nickname,
        at: row.loggedAt.toISOString(),
      })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));

    const start = Math.max(0, skip);
    const size = Math.min(50, Math.max(1, take));
    return {
      items: merged.slice(start, start + size),
      total: merged.length,
    };
  }

  async getPeople(): Promise<AdminPeople> {
    const today = kstTodayRange();
    const visitDate = todayKstDate();

    const [guests, todayVisitCount, todayLoginCount, feed] = await Promise.all([
      this.prisma.user.findMany({
        where: this.guestWhere(),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nickname: true,
          createdAt: true,
          lobbyVisits: {
            orderBy: { visitedAt: 'desc' },
            take: 1,
            select: { visitedAt: true },
          },
          loginLogs: {
            orderBy: { loggedAt: 'desc' },
            take: 1,
            select: { loggedAt: true },
          },
        },
      }),
      this.prisma.lobbyVisit.count({
        where: { visitDate, user: this.guestWhere() },
      }),
      this.prisma.adminLoginLog.count({
        where: {
          loggedAt: { gte: today.start, lt: today.end },
          user: this.guestWhere(),
        },
      }),
      this.getPeopleFeed(0, 20),
    ]);

    return {
      guests: guests.map((row) => ({
        id: row.id,
        nickname: row.nickname,
        createdAt: row.createdAt.toISOString(),
        lastVisitedAt: row.lobbyVisits[0]?.visitedAt.toISOString() ?? null,
        lastLoggedAt: row.loginLogs[0]?.loggedAt.toISOString() ?? null,
      })),
      todayVisitCount,
      todayLoginCount,
      feed: feed.items,
      feedTotal: feed.total,
    };
  }
}
