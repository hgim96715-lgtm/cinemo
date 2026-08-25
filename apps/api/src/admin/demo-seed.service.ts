import { ConflictException, Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import { CAFE_TABLE_SLOTS, GACHA_MACHINES } from '@cinemo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import {
  cafeDayRange,
  kstDateKey,
  kstDayRange,
  toKstDate,
} from '../lib/date-kst';

type DemoPersonas = {
  nicknames: string[];
  reviews: { body: string; rating: number }[];
  profiles: { bio: string | null; tags: string[]; profilePublic: boolean }[];
};

type DemoUser = {
  id: string;
  nickname: string;
  email: string;
  isNew: boolean;
};

type DemoSeedSummary = {
  date: string;
  activities: number;
  createdUsers: number;
  cafeMessages: number;
};

const DAY_MS = 86_400_000;
const DEMO_EMAIL_DOMAIN = 'demo.cinemo.invalid';
const DEMO_EMAIL_PREFIX = 'demo';
const DEMO_TOTAL_ACTIVITY = 5;
const DEMO_NEW_PER_DAY = 2;
const CAFE_MESSAGES = [
  '오늘은 어떤 영화가 제일 끌려요?',
  '방금 뽑은 영화 포스터 분위기가 좋네요.',
  '후기방에 짧게 감상도 남겨볼까 해요.',
  '이 시간에 영화 이야기하니 카페 같아서 좋다.',
  '다음에는 추천방에서 한 편 골라봐야겠어요.',
  '오늘의 한 편, 생각보다 오래 기억에 남을 듯해요.',
] as const;

@Injectable()
export class DemoSeedService {
  private personas: DemoPersonas | null = null;
  private passwordHash: string | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
  ) {}

  async seedRecentDays(days: number, now = new Date()) {
    if (this.running) {
      throw new ConflictException('demo seed가 이미 실행 중입니다.');
    }
    this.running = true;

    try {
      const count = Math.min(Math.max(Math.trunc(days), 1), 7);
      const todayKey = kstDateKey(now);
      const dates = Array.from({ length: count }, (_, index) =>
        this.shiftDateKey(todayKey, index - count + 1),
      );
      const summaries: DemoSeedSummary[] = [];

      for (const dateKey of dates) {
        summaries.push(await this.seedDay(dateKey, now));
      }

      return { days: count, summaries };
    } finally {
      this.running = false;
    }
  }

  async purge() {
    if (this.running) {
      throw new ConflictException(
        'demo seed가 실행 중이라 삭제할 수 없습니다.',
      );
    }
    const users = await this.prisma.user.findMany({
      where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
      select: { id: true },
    });
    if (users.length === 0) return { users: 0, rebuiltDates: 0 };

    const userIds = users.map((user) => user.id);
    const [visits, logins, tickets, reviews, messages] = await Promise.all([
      this.prisma.lobbyVisit.findMany({
        where: { userId: { in: userIds } },
        select: { visitDate: true },
      }),
      this.prisma.adminLoginLog.findMany({
        where: { userId: { in: userIds } },
        select: { loggedAt: true },
      }),
      this.prisma.ticket.findMany({
        where: { userId: { in: userIds } },
        select: { ticketDate: true },
      }),
      this.prisma.reviewPost.findMany({
        where: { userId: { in: userIds } },
        select: { createdAt: true },
      }),
      this.prisma.cafeMessage.findMany({
        where: { userId: { in: userIds } },
        select: { createdAt: true },
      }),
    ]);
    const affectedDates = new Set<string>([
      ...visits.map((row) => kstDateKey(row.visitDate)),
      ...logins.map((row) => kstDateKey(row.loggedAt)),
      ...tickets.map((row) => kstDateKey(row.ticketDate)),
      ...reviews.map((row) => kstDateKey(row.createdAt)),
      ...messages.map((row) => kstDateKey(row.createdAt)),
    ]);

    await this.prisma.$transaction([
      this.prisma.reviewPostLike.deleteMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { post: { userId: { in: userIds } } },
          ],
        },
      }),
      this.prisma.reviewPost.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.ticket.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.userMovie.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.lobbyVisit.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.adminLoginLog.deleteMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.cafeMessage.deleteMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.cafeTableSeat.deleteMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.movieProviderOverride.deleteMany({
        where: { createdBy: { in: userIds } },
      }),
      this.prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);

    for (const dateKey of affectedDates) {
      await this.rebuildStats(dateKey);
    }
    return { users: users.length, rebuiltDates: affectedDates.size };
  }

  private async seedDay(dateKey: string, now: Date): Promise<DemoSeedSummary> {
    const personas = this.loadPersonas();
    const passwordHash = await this.getPasswordHash();
    const date = toKstDate(this.atKstStart(dateKey));
    const returnCount = Math.max(0, DEMO_TOTAL_ACTIVITY - DEMO_NEW_PER_DAY);
    let createdUsers = 0;
    let activities = 0;
    let sequence = 1;
    const users: DemoUser[] = [];

    for (let index = 0; index < DEMO_NEW_PER_DAY; index += 1) {
      const eventAt = this.activityTime(dateKey, index, 'register');
      const email = this.demoEmail(dateKey, sequence);
      const nickname = this.demoNickname(personas, dateKey, sequence);
      const existing = await this.prisma.user.findUnique({ where: { email } });
      const user =
        existing ??
        (await this.prisma.user.create({
          data: {
            email,
            passwordHash,
            nickname,
            bio: this.pick(personas.profiles, dateKey, sequence)?.bio ?? null,
            tags: this.pick(personas.profiles, dateKey, sequence)?.tags ?? [],
            profilePublic:
              this.pick(personas.profiles, dateKey, sequence)?.profilePublic ??
              true,
            createdAt: eventAt,
            updatedAt: eventAt,
          },
        }));
      if (!existing) createdUsers += 1;
      users.push({ id: user.id, nickname: user.nickname, email, isNew: true });
      sequence += 1;
    }

    const returning = await this.findReturningUsers(dateKey, returnCount);
    for (const user of returning) {
      users.push({ ...user, isNew: false });
    }

    const movies = await this.prisma.moviePool.findMany({
      select: { tmdbId: true },
      orderBy: { syncedAt: 'desc' },
      take: 200,
    });
    if (movies.length === 0) {
      throw new Error('MoviePool이 비어 있어 demo 뽑기를 만들 수 없습니다.');
    }

    for (let index = 0; index < users.length; index += 1) {
      const user = users[index];
      const eventAt = this.activityTime(dateKey, index, 'activity');
      if (!user.isNew) {
        const logged = await this.prisma.adminLoginLog.findFirst({
          where: {
            userId: user.id,
            loggedAt: {
              gte: kstDayRange(dateKey).start,
              lt: kstDayRange(dateKey).end,
            },
          },
        });
        if (!logged) {
          await this.prisma.adminLoginLog.create({
            data: { userId: user.id, loggedAt: eventAt },
          });
          await this.adminService.countIncrement('logins', eventAt);
        }
      }

      const visit = await this.prisma.lobbyVisit.findUnique({
        where: { userId_visitDate: { userId: user.id, visitDate: date } },
      });
      if (!visit) {
        await this.prisma.lobbyVisit.create({
          data: { userId: user.id, visitDate: date, visitedAt: eventAt },
        });
        await this.adminService.countIncrement('visits', eventAt);
      }

      const movieId =
        movies[this.indexFor(dateKey, index, movies.length)].tmdbId;
      const ticket = await this.prisma.ticket.findUnique({
        where: { userId_ticketDate: { userId: user.id, ticketDate: date } },
      });
      let tmdbId = ticket?.tmdbId ?? movieId;
      if (!ticket) {
        await this.prisma.ticket.create({
          data: {
            userId: user.id,
            ticketDate: date,
            machineId:
              GACHA_MACHINES[
                this.indexFor(dateKey, index, GACHA_MACHINES.length)
              ].id,
            tmdbId,
            status: 'used',
            issuedAt: new Date(eventAt.getTime() - 3 * 60_000),
            usedAt: eventAt,
            createdAt: eventAt,
            updatedAt: eventAt,
          },
        });
        await this.adminService.countIncrement('ticketsIssued', eventAt);
        await this.adminService.countIncrement('ticketsUsed', eventAt);
      } else if (ticket.status === 'issued') {
        tmdbId = ticket.tmdbId ?? movieId;
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            machineId:
              GACHA_MACHINES[
                this.indexFor(dateKey, index, GACHA_MACHINES.length)
              ].id,
            tmdbId,
            status: 'used',
            usedAt: eventAt,
          },
        });
        await this.adminService.countIncrement('ticketsUsed', eventAt);
      }

      const review = await this.prisma.reviewPost.findFirst({
        where: {
          userId: user.id,
          createdAt: {
            gte: kstDayRange(dateKey).start,
            lt: kstDayRange(dateKey).end,
          },
        },
      });
      if (!review) {
        const template = this.pick(personas.reviews, dateKey, index)!;
        await this.prisma.reviewPost.create({
          data: {
            userId: user.id,
            tmdbId,
            body: template.body,
            rating: template.rating,
            createdAt: eventAt,
            updatedAt: eventAt,
          },
        });
        await this.adminService.countIncrement('reviews', eventAt);
        activities += 1;
      }
    }

    const cafeMessages =
      dateKey === kstDateKey(now) ? await this.seedCafe(users, now) : 0;

    return { date: dateKey, activities, createdUsers, cafeMessages };
  }

  private async seedCafe(users: DemoUser[], now: Date): Promise<number> {
    await this.prisma.cafeTableSession.createMany({
      data: CAFE_TABLE_SLOTS.map((tableId) => ({ tableId })),
      skipDuplicates: true,
    });

    const ids = users.map((user) => user.id);
    const existingSeats = await this.prisma.cafeTableSeat.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, tableId: true },
    });
    const seatByUser = new Map(
      existingSeats.map((seat) => [seat.userId, seat.tableId]),
    );
    let created = 0;

    for (let index = 0; index < users.length; index += 1) {
      const user = users[index];
      const tableId = CAFE_TABLE_SLOTS[index % CAFE_TABLE_SLOTS.length];
      const currentTable = seatByUser.get(user.id);
      if (currentTable && currentTable !== tableId) continue;

      if (!currentTable) {
        await this.prisma.cafeTableSeat.create({
          data: {
            tableId,
            userId: user.id,
            joinedAt: new Date(
              now.getTime() - (users.length - index) * 180_000,
            ),
          },
        });
        seatByUser.set(user.id, tableId);
      }

      const createdAt = new Date(
        now.getTime() - (users.length - index) * 120_000,
      );
      const body = CAFE_MESSAGES[index % CAFE_MESSAGES.length];
      const cafeRange = cafeDayRange(now);
      const duplicate = await this.prisma.cafeMessage.findFirst({
        where: {
          tableId,
          userId: user.id,
          body,
          createdAt: { gte: cafeRange.start, lt: cafeRange.end },
        },
      });
      if (duplicate) continue;

      await this.prisma.cafeMessage.create({
        data: {
          tableId,
          userId: user.id,
          body,
          createdAt,
          updatedAt: createdAt,
        },
      });
      await this.adminService.countIncrement('cafeMessages', createdAt);
      created += 1;
    }

    return created;
  }

  private async rebuildStats(dateKey: string) {
    const date = toKstDate(this.atKstStart(dateKey));
    const range = kstDayRange(dateKey);
    const userFilter = { user: { role: 'user' as const } };
    const [visits, logins, ticketsIssued, ticketsUsed, reviews, cafeMessages] =
      await Promise.all([
        this.prisma.lobbyVisit.count({
          where: { visitDate: date, ...userFilter },
        }),
        this.prisma.adminLoginLog.count({
          where: {
            loggedAt: { gte: range.start, lt: range.end },
            ...userFilter,
          },
        }),
        this.prisma.ticket.count({
          where: { ticketDate: date, ...userFilter },
        }),
        this.prisma.ticket.count({
          where: { ticketDate: date, status: 'used', ...userFilter },
        }),
        this.prisma.reviewPost.count({
          where: {
            createdAt: { gte: range.start, lt: range.end },
            ...userFilter,
          },
        }),
        this.prisma.cafeMessage.count({
          where: {
            createdAt: { gte: range.start, lt: range.end },
            ...userFilter,
          },
        }),
      ]);

    await this.prisma.adminDailyStat.upsert({
      where: { date },
      create: {
        date,
        visits,
        logins,
        ticketsIssued,
        ticketsUsed,
        reviews,
        cafeMessages,
      },
      update: {
        visits,
        logins,
        ticketsIssued,
        ticketsUsed,
        reviews,
        cafeMessages,
      },
    });

    const [visitRows, loginRows, cafeRows] = await Promise.all([
      this.prisma.lobbyVisit.findMany({
        where: { visitDate: date, ...userFilter },
        select: { visitedAt: true },
      }),
      this.prisma.adminLoginLog.findMany({
        where: { loggedAt: { gte: range.start, lt: range.end }, ...userFilter },
        select: { loggedAt: true },
      }),
      this.prisma.cafeMessage.findMany({
        where: {
          createdAt: { gte: range.start, lt: range.end },
          ...userFilter,
        },
        select: { createdAt: true },
      }),
    ]);
    const hourly = new Map<
      number,
      { visits: number; logins: number; cafeMessages: number }
    >();
    const add = (hour: number, field: 'visits' | 'logins' | 'cafeMessages') => {
      const row = hourly.get(hour) ?? { visits: 0, logins: 0, cafeMessages: 0 };
      row[field] += 1;
      hourly.set(hour, row);
    };
    for (const row of visitRows) add(this.hourOf(row.visitedAt), 'visits');
    for (const row of loginRows) add(this.hourOf(row.loggedAt), 'logins');
    for (const row of cafeRows) add(this.hourOf(row.createdAt), 'cafeMessages');

    await this.prisma.$transaction([
      this.prisma.adminHourlyStat.deleteMany({ where: { date } }),
      this.prisma.adminHourlyStat.createMany({
        data: [...hourly.entries()].map(([hour, counts]) => ({
          date,
          hour,
          ...counts,
        })),
      }),
    ]);
  }

  private hourOf(value: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(value);
    return Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  }

  private async findReturningUsers(
    dateKey: string,
    limit: number,
  ): Promise<Omit<DemoUser, 'isNew'>[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` },
        createdAt: { lt: this.atKstStart(dateKey) },
        reviewPosts: {
          none: {
            createdAt: {
              gte: kstDayRange(dateKey).start,
              lt: kstDayRange(dateKey).end,
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, nickname: true, email: true },
    });
    return rows;
  }

  private loadPersonas(): DemoPersonas {
    if (this.personas) return this.personas;
    const file = join(
      process.cwd(),
      '../../disposable/demo-seed/personas.json',
    );
    this.personas = JSON.parse(readFileSync(file, 'utf8')) as DemoPersonas;
    return this.personas;
  }

  private async getPasswordHash(): Promise<string> {
    if (this.passwordHash) return this.passwordHash;
    const password = process.env.DEMO_SEED_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error('DEMO_SEED_PASSWORD가 8자 이상 필요합니다.');
    }
    this.passwordHash = await bcrypt.hash(password, 10);
    return this.passwordHash;
  }

  private demoEmail(dateKey: string, sequence: number) {
    return `${DEMO_EMAIL_PREFIX}+${dateKey}-${sequence}@${DEMO_EMAIL_DOMAIN}`;
  }

  private demoNickname(
    personas: DemoPersonas,
    dateKey: string,
    sequence: number,
  ) {
    const base = this.pick(personas.nicknames, dateKey, sequence)!;
    return `${base}_${dateKey.replace(/-/g, '')}${sequence}`.slice(0, 20);
  }

  private pick<T>(items: T[], dateKey: string, index: number): T | undefined {
    if (items.length === 0) return undefined;
    return items[this.indexFor(dateKey, index, items.length)];
  }

  private indexFor(dateKey: string, index: number, length: number) {
    let hash = index + 17;
    for (const char of dateKey) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return Math.abs(hash) % length;
  }

  private activityTime(
    dateKey: string,
    index: number,
    kind: 'register' | 'activity',
  ) {
    const slot = this.indexFor(
      dateKey,
      index + (kind === 'register' ? 3 : 11),
      12,
    );
    const minute = this.indexFor(dateKey, index + 29, 55);
    return new Date(
      `${dateKey}T${String(10 + slot).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`,
    );
  }

  private atKstStart(dateKey: string) {
    return new Date(`${dateKey}T00:00:00+09:00`);
  }

  private shiftDateKey(dateKey: string, offset: number) {
    return kstDateKey(
      new Date(kstDayRange(dateKey).start.getTime() + offset * DAY_MS),
    );
  }
}
