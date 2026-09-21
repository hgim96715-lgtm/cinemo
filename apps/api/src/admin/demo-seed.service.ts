import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { kstDateKey, kstDayRange, toKstDate } from '../lib/date-kst';
import { clamp } from '../lib/clamp';

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
  {
    text: '오늘의 기분과 이상하게 잘 맞았던 영화.',
    originalText: null,
  },
  {
    text: '말보다 표정이 오래 기억에 남았다.',
    originalText: null,
  },
  {
    text: '작은 장면 하나 때문에 다시 보고 싶어졌다.',
    originalText: 'One small scene made me want to watch it again.',
  },
  {
    text: '영화가 끝난 뒤 조용히 생각할 시간이 필요했다.',
    originalText: null,
  },
  {
    text: '누군가에게 추천하고 싶은 밤의 영화.',
    originalText: null,
  },
] as const;

const POSTCARD_COMMENT_SAMPLES = [
  '이 장면 정말 좋았어요. 영화 보고 나서도 계속 생각났어요.',
  '저도 이 문장 마음에 남았어요. 다시 보고 싶네요.',
  '엽서 분위기와 문장이 잘 어울려요.',
  '이 영화 아직 못 봤는데 궁금해졌어요.',
  '좋은 문장 남겨줘서 고마워요.',
  '포스터랑 문장이 같이 보이니까 영화 분위기가 더 잘 느껴져요.',
  '저는 이 장면에서 잠깐 멈춰서 생각하게 되더라고요.',
  '이 영화의 다른 장면도 이런 느낌인지 궁금해졌어요.',
  '짧은 문장인데 영화의 여운이 잘 전해져요.',
  '다음에 볼 영화 목록에 넣어둘게요.',
  '이런 기록을 보니까 저도 한 장 남기고 싶네요.',
  '영화를 본 사람만 알아볼 수 있는 문장이라 더 좋아요.',
] as const;

const POSTCARD_REPLY_SAMPLES = [
  '맞아요. 저도 그 여운이 오래 갔어요.',
  '그쵸? 다음에 같이 이야기해보고 싶어요.',
  '좋게 봐줘서 고마워요!',
  '시간 나면 꼭 봐보세요.',
  '저도 다음에 다시 보려고요.',
  '그 장면을 이렇게 표현할 수도 있겠네요.',
  '저도 비슷한 느낌으로 받아들였어요.',
  '추천 고마워요. 주말에 찾아볼게요.',
  '다 보고 나서 이 문장을 다시 읽어봐야겠어요.',
  '다음 엽서도 기대할게요.',
] as const;
@Injectable()
export class DemoSeedService {
  private personas: DemoPersonas | null = null;
  private passwordHash: string | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  async seedRecentDays(days: number, now = new Date()) {
    if (this.running) {
      throw new ConflictException('demo seed가 이미 실행 중입니다.');
    }
    this.running = true;

    try {
      const count = clamp(Math.trunc(days), 1, 7);
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
    const [visits, logins] = await Promise.all([
      this.prisma.lobbyVisit.findMany({
        where: { userId: { in: userIds } },
        select: { visitDate: true },
      }),
      this.prisma.adminLoginLog.findMany({
        where: { userId: { in: userIds } },
        select: { loggedAt: true },
      }),
    ]);
    const affectedDates = new Set<string>([
      ...visits.map((row) => kstDateKey(row.visitDate)),
      ...logins.map((row) => kstDateKey(row.loggedAt)),
    ]);

    await this.prisma.$transaction([
      this.prisma.userMovie.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.lobbyVisit.deleteMany({ where: { userId: { in: userIds } } }),
      this.prisma.adminLoginLog.deleteMany({
        where: { userId: { in: userIds } },
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
      throw new Error(
        'MoviePool이 비어 있어 demo 관람 기록을 만들 수 없습니다.',
      );
    }
    const upcomingMovies = movies
      .filter(
        (movie) => movie.releaseDate && movie.releaseDate >= kstDateKey(now),
      )
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
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
      const tmdbId = movie.tmdbId;

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

      const wishedMovies = this.selectWishMovies(
        dateKey,
        index,
        upcomingMovies,
      );
      const wishedMovieIds = wishedMovies.map((movie) => movie.tmdbId);

      if (wishedMovieIds.length === 0) {
        await this.prisma.userMovie.deleteMany({
          where: { userId: user.id, kind: 'wish' },
        });
      } else {
        await this.prisma.userMovie.deleteMany({
          where: {
            userId: user.id,
            kind: 'wish',
            tmdbId: { notIn: wishedMovieIds },
          },
        });
      }

      for (const wishedMovie of wishedMovies) {
        await this.prisma.userMovie.upsert({
          where: {
            userId_tmdbId_kind: {
              userId: user.id,
              tmdbId: wishedMovie.tmdbId,
              kind: 'wish',
            },
          },
          create: {
            userId: user.id,
            tmdbId: wishedMovie.tmdbId,
            kind: 'wish',
          },
          update: {},
        });
      }

      activities += 1;
    }

    const createdPostcards = await this.seedPostcardCommunity(users, dateKey);

    return {
      date: dateKey,
      activities,
      createdUsers,
      createdPostcards,
    };
  }

  private async seedPostcardCommunity(users: DemoUser[], dateKey: string) {
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
      const owner = users[index];
      const movie = movies[index % movies.length];
      const sample = this.pick(POSTCARD_SAMPLES, dateKey, index)!;
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
        const commenterId = commenterIds[commentIndex];
        const commentText =
          this.pick(
            POSTCARD_COMMENT_SAMPLES,
            dateKey,
            index * 3 + commentIndex,
          )!;
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
          this.pick(POSTCARD_REPLY_SAMPLES, dateKey, index)!;
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
    const [visits, logins] = await Promise.all([
      this.prisma.lobbyVisit.count({
        where: { visitDate: date, ...userFilter },
      }),
      this.prisma.adminLoginLog.count({
        where: {
          loggedAt: { gte: range.start, lt: range.end },
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
      },
      update: {
        visits,
        logins,
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
    const password = this.configService.get<string>('demo.password');
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

  private pick<T>(
    items: readonly T[],
    dateKey: string,
    index: number,
  ): T | undefined {
    if (items.length === 0) return undefined;
    return items[this.indexFor(dateKey, index, items.length)];
  }

  private selectWishMovies(
    dateKey: string,
    userIndex: number,
    upcomingMovies: { tmdbId: number; title: string; releaseDate: string }[],
  ) {
    if (upcomingMovies.length === 0) return [];

    // 사용자마다 0~2편만 찜하도록 해 모든 사용자가 같은 영화를 찜하지 않게 함.
    const wishCount = Math.min(
      this.indexFor(dateKey, userIndex + 67, 3),
      upcomingMovies.length,
    );
    const startIndex = this.indexFor(
      dateKey,
      userIndex + 79,
      upcomingMovies.length,
    );
    const selected = new Set<number>();

    for (let offset = 0; selected.size < wishCount; offset += 1) {
      selected.add(
        (startIndex + offset * 7) % upcomingMovies.length,
      );
    }

    return [...selected].map((index) => upcomingMovies[index]);
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
