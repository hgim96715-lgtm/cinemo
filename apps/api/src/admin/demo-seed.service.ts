import { ConflictException, Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import { GACHA_MACHINES } from '@cinemo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { kstDateKey, kstDayRange, toKstDate } from '../lib/date-kst';

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
  createdPostcards: number;
};

const DAY_MS = 86_400_000;
const DEMO_EMAIL_DOMAIN = 'demo.cinemo.invalid';
const DEMO_EMAIL_PREFIX = 'demo';
const DEMO_TOTAL_ACTIVITY = 5;
const DEMO_NEW_PER_DAY = 2;

const POSTCARD_SAMPLES = [
  {
    text: '좋은 장면은 영화가 끝난 뒤에도 오래 남는다.',
    originalText: 'The best scenes stay with you long after the movie ends.',
  },
  {
    text: '오늘의 한 편을 조용히 기억해두자.',
    originalText: null,
  },
  {
    text: '괜찮아, 천천히 가도 돼.',
    originalText: 'It is okay. You can take your time.',
  },
  {
    text: '끝난 뒤에도 마음에 남는 영화였다.',
    originalText: null,
  },
  {
    text: '생각보다 오래 마음에 머무는 장면.',
    originalText: 'A scene that stays in your heart longer than expected.',
  },
] as const;

const POSTCARD_COMMENT_SAMPLES = [
  '이 장면 정말 좋았어요. 영화 보고 나서도 계속 생각났어요.',
  '저도 이 문장 마음에 남았어요. 다시 보고 싶네요.',
  '엽서 분위기와 문장이 잘 어울려요.',
  '이 영화 아직 못 봤는데 궁금해졌어요.',
  '좋은 문장 남겨줘서 고마워요.',
] as const;

const POSTCARD_REPLY_SAMPLES = [
  '맞아요. 저도 그 여운이 오래 갔어요.',
  '그쵸? 다음에 같이 이야기해보고 싶어요.',
  '좋게 봐줘서 고마워요!',
  '시간 나면 꼭 봐보세요.',
  '저도 다음에 다시 보려고요.',
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
    const [visits, logins, tickets] = await Promise.all([
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
    ]);
    const affectedDates = new Set<string>([
      ...visits.map((row) => kstDateKey(row.visitDate)),
      ...logins.map((row) => kstDateKey(row.loggedAt)),
      ...tickets.map((row) => kstDateKey(row.ticketDate)),
    ]);

    await this.prisma.$transaction([
      this.prisma.ticket.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.userMovie.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.lobbyVisit.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.adminLoginLog.deleteMany({
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
      select: { tmdbId: true, title: true, releaseDate: true },
      orderBy: { syncedAt: 'desc' },
      take: 200,
    });
    if (movies.length === 0) {
      throw new Error('MoviePool이 비어 있어 demo 뽑기를 만들 수 없습니다.');
    }
    const upcomingMovies = movies
      .filter(
        (movie) => movie.releaseDate && movie.releaseDate >= kstDateKey(now),
      )
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    const featuredUpcomingMovie = upcomingMovies[0];

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

      const movie = movies[this.indexFor(dateKey, index, movies.length)];
      const movieId = movie.tmdbId;
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

      const selectedMovie = await this.prisma.moviePool.findUnique({
        where: { tmdbId },
        select: { title: true },
      });
      const movieTitle = selectedMovie?.title ?? movie.title;

      const reviewTemplate = this.pick(personas.reviews, dateKey, index)!;
      await this.prisma.userMovie.upsert({
        where: {
          userId_tmdbId_kind: {
            userId: user.id,
            tmdbId,
            kind: 'watched',
          },
        },
        create: {
          userId: user.id,
          tmdbId,
          kind: 'watched',
          watchedAt: eventAt,
          viewingType: 'theater',
          viewingLocation: 'CINEMO',
          review: reviewTemplate.body,
          rating: reviewTemplate.rating,
        },
        update: {},
      });

      if (featuredUpcomingMovie) {
        await this.prisma.userMovie.upsert({
          where: {
            userId_tmdbId_kind: {
              userId: user.id,
              tmdbId: featuredUpcomingMovie.tmdbId,
              kind: 'wish',
            },
          },
          create: {
            userId: user.id,
            tmdbId: featuredUpcomingMovie.tmdbId,
            kind: 'wish',
          },
          update: {},
        });
      }

      activities += 1;
    }

    const createdPostcards = await this.seedPostcardCommunity(users);

    return {
      date: dateKey,
      activities,
      createdUsers,
      createdPostcards,
    };
  }

  private async seedPostcardCommunity(users: DemoUser[]) {
    if (users.length === 0) return 0;

    const movies = await this.prisma.moviePool.findMany({
      orderBy: { syncedAt: 'desc' },
      take: Math.max(users.length, POSTCARD_SAMPLES.length),
      select: {
        tmdbId: true,
        title: true,
        posterPath: true,
      },
    });

    if (movies.length === 0) return 0;

    let createdPostcards = 0;

    for (let index = 0; index < users.length; index += 1) {
      const owner = users[index]!;
      const movie = movies[index % movies.length]!;
      const sample = POSTCARD_SAMPLES[index % POSTCARD_SAMPLES.length]!;
      const posterPath = movie.posterPath
        ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
        : null;

      const existingPostcard = await this.prisma.postcard.findFirst({
        where: {
          userId: owner.id,
          tmdbId: movie.tmdbId,
          text: sample.text,
        },
      });

      const postcard =
        existingPostcard ??
        (await this.prisma.postcard.create({
          data: {
            userId: owner.id,
            tmdbId: movie.tmdbId,
            movieTitle: movie.title,
            originalText: sample.originalText,
            text: sample.text,
            posterPath,
            isPublic: true,
          },
        }));

      if (!existingPostcard) createdPostcards += 1;

      const commenterIds = Array.from(
        new Set(
          [1, 2, 3]
            .map((offset) => users[(index + offset) % users.length]?.id)
            .filter((userId): userId is string => userId !== owner.id),
        ),
      );

      let firstCommentId: string | null = null;
      for (
        let commentIndex = 0;
        commentIndex < commenterIds.length;
        commentIndex += 1
      ) {
        const commenterId = commenterIds[commentIndex]!;
        const commentText =
          POSTCARD_COMMENT_SAMPLES[
            (index + commentIndex) % POSTCARD_COMMENT_SAMPLES.length
          ]!;
        const existingComment = await this.prisma.postcardComment.findFirst({
          where: {
            postcardId: postcard.id,
            userId: commenterId,
            parentId: null,
            text: commentText,
          },
        });
        const comment =
          existingComment ??
          (await this.prisma.postcardComment.create({
            data: {
              postcardId: postcard.id,
              userId: commenterId,
              text: commentText,
            },
          }));

        if (!firstCommentId) firstCommentId = comment.id;
      }

      const replyAuthorId = users[(index + 3) % users.length]?.id;
      if (firstCommentId && replyAuthorId && replyAuthorId !== owner.id) {
        const replyText =
          POSTCARD_REPLY_SAMPLES[index % POSTCARD_REPLY_SAMPLES.length]!;
        const existingReply = await this.prisma.postcardComment.findFirst({
          where: {
            postcardId: postcard.id,
            userId: replyAuthorId,
            parentId: firstCommentId,
            text: replyText,
          },
        });

        if (!existingReply) {
          await this.prisma.postcardComment.create({
            data: {
              postcardId: postcard.id,
              userId: replyAuthorId,
              parentId: firstCommentId,
              text: replyText,
            },
          });
        }
      }
    }

    return createdPostcards;
  }

  private async rebuildStats(dateKey: string) {
    const date = toKstDate(this.atKstStart(dateKey));
    const range = kstDayRange(dateKey);
    const userFilter = { user: { role: 'user' as const } };
    const [visits, logins, ticketsIssued, ticketsUsed] = await Promise.all([
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
    ]);

    await this.prisma.adminDailyStat.upsert({
      where: { date },
      create: {
        date,
        visits,
        logins,
        ticketsIssued,
        ticketsUsed,
      },
      update: {
        visits,
        logins,
        ticketsIssued,
        ticketsUsed,
      },
    });

    const [visitRows, loginRows] = await Promise.all([
      this.prisma.lobbyVisit.findMany({
        where: { visitDate: date, ...userFilter },
        select: { visitedAt: true },
      }),
      this.prisma.adminLoginLog.findMany({
        where: { loggedAt: { gte: range.start, lt: range.end }, ...userFilter },
        select: { loggedAt: true },
      }),
    ]);
    const hourly = new Map<number, { visits: number; logins: number }>();
    const add = (hour: number, field: 'visits' | 'logins') => {
      const row = hourly.get(hour) ?? { visits: 0, logins: 0 };
      row[field] += 1;
      hourly.set(hour, row);
    };
    for (const row of visitRows) add(this.hourOf(row.visitedAt), 'visits');
    for (const row of loginRows) add(this.hourOf(row.loggedAt), 'logins');

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
        userMovies: {
          none: {
            kind: 'watched',
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
