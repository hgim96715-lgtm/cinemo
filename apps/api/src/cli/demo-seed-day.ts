/**
 * 운영 전 demo 활동 시드 — 하루 1회 (로컬/staging only)
 *
 * ENABLE_DEMO_SEED=1 DEMO_SEED_PASSWORD=... pnpm --filter api demo:seed-day
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { GACHA_MACHINES, type GachaMachineId } from '@cinemo/shared';
import { AppModule } from '../app.module';
import { AdminService } from '../admin/admin.service';
import { AuthService } from '../auth/auth.service';
import { TicketService } from '../ticket/ticket.service';
import { LobbyBoardService } from '../lobby-board/lobby-board.service';
import { PrismaService } from '../prisma/prisma.service';
import { kstDateKey, kstTodayRange, todayKstDate } from '../lib/date-kst';
import {
  DEMO_SEED,
  demoEmail,
  disposableDemoSeedDir,
  isDemoEmail,
} from './demo-seed-config';

type Personas = {
  nicknames: string[];
  reviews: { body: string; rating: number }[];
  profiles: {
    bio: string | null;
    tags: string[];
    profilePublic: boolean;
  }[];
};

type ReviewTemplate = { body: string; rating: number };
type ProfileTemplate = Personas['profiles'][number];

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

function loadPersonas(): Personas {
  const path = join(disposableDemoSeedDir(), 'personas.json');
  return JSON.parse(readFileSync(path, 'utf8')) as Personas;
}

function assertEnv() {
  if (process.env.NODE_ENV === 'production') {
    console.error('[demo-seed] production 환경에서는 실행할 수 없음');
    process.exit(1);
  }
  if (process.env.ENABLE_DEMO_SEED !== '1') {
    console.error('[demo-seed] ENABLE_DEMO_SEED=1 필요');
    process.exit(1);
  }
  const password = process.env.DEMO_SEED_PASSWORD;
  if (!password || password.length < 8) {
    console.error('[demo-seed] DEMO_SEED_PASSWORD 8자 이상 필요');
    process.exit(1);
  }
  return password;
}

function pickMachine(): GachaMachineId {
  const m = GACHA_MACHINES[Math.floor(Math.random() * GACHA_MACHINES.length)]!;
  return m.id;
}

function pickReview(personas: Personas): ReviewTemplate {
  return personas.reviews[Math.floor(Math.random() * personas.reviews.length)]!;
}

function pickProfile(personas: Personas): ProfileTemplate {
  return personas.profiles[
    Math.floor(Math.random() * personas.profiles.length)
  ]!;
}

async function seedProfile(
  auth: AuthService,
  userId: string,
  personas: Personas,
) {
  const profile = pickProfile(personas);
  await auth.updateProfile(userId, {
    bio: profile.bio,
    tags: profile.tags,
    profilePublic: profile.profilePublic,
  });
  const tagPreview =
    profile.tags.length > 0 ? profile.tags.map((t) => `#${t}`).join(' ') : '—';
  console.log(
    `[demo-seed] profile ${profile.profilePublic ? '공개' : '비공개'} · ${tagPreview}`,
  );
}

function pickNickname(
  personas: Personas,
  dateKey: string,
  seq: number,
): string {
  const base =
    personas.nicknames[Math.floor(Math.random() * personas.nicknames.length)]!;
  const suffix = `${dateKey.replace(/-/g, '')}${seq}`;
  const nick = `${base}_${suffix}`.slice(0, 20);
  return nick.length >= 2 ? nick : `u_${suffix}`.slice(0, 20);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type SeedResult =
  | {
      ok: true;
      nickname: string;
      movieTitle: string;
      tmdbId: number;
    }
  | { ok: false; nickname: string; reason: string };

async function runUserActivity(
  userId: string,
  nickname: string,
  personas: Personas,
  deps: {
    ticket: TicketService;
    lobby: LobbyBoardService;
    prisma: PrismaService;
  },
): Promise<SeedResult> {
  await deps.lobby.recordVisit(userId);

  const ticketDate = todayKstDate();
  const existing = await deps.prisma.ticket.findUnique({
    where: { userId_ticketDate: { userId, ticketDate } },
  });

  let tmdbId: number;
  let movieTitle: string;

  if (!existing) {
    await deps.ticket.issueToday(userId);
    const used = await deps.ticket.useToday(userId, pickMachine());
    tmdbId = used.movie.id;
    movieTitle = used.movie.title;
  } else if (existing.status === 'issued') {
    const used = await deps.ticket.useToday(userId, pickMachine());
    tmdbId = used.movie.id;
    movieTitle = used.movie.title;
  } else if (existing.status === 'used' && existing.tmdbId != null) {
    const movie = await deps.prisma.moviePool.findUnique({
      where: { tmdbId: existing.tmdbId },
      select: { tmdbId: true, title: true },
    });
    if (!movie) {
      return { ok: false, nickname, reason: '티켓 영화 풀 없음' };
    }
    tmdbId = movie.tmdbId;
    movieTitle = movie.title;
  } else {
    return { ok: false, nickname, reason: '티켓 상태 처리 불가' };
  }

  const template = pickReview(personas);
  await deps.prisma.userMovie.upsert({
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
      watchedAt: new Date(),
      viewingType: 'theater',
      viewingLocation: 'CINEMO',
      review: template.body,
      rating: template.rating,
    },
    update: {},
  });

  const upcomingMovies = await deps.prisma.moviePool.findMany({
    where: { releaseDate: { gte: kstDateKey() } },
    orderBy: { releaseDate: 'asc' },
    take: 30,
    select: { tmdbId: true },
  });
  const wishMovie = upcomingMovies[0];
  if (wishMovie) {
    await deps.prisma.userMovie.upsert({
      where: {
        userId_tmdbId_kind: {
          userId,
          tmdbId: wishMovie.tmdbId,
          kind: 'wish',
        },
      },
      create: {
        userId,
        tmdbId: wishMovie.tmdbId,
        kind: 'wish',
      },
      update: {},
    });
  }

  return { ok: true, nickname, movieTitle, tmdbId };
}

async function seedPostcardCommunity(prisma: PrismaService, userIds: string[]) {
  if (userIds.length === 0) return 0;

  const movies = await prisma.moviePool.findMany({
    orderBy: { syncedAt: 'desc' },
    take: Math.max(userIds.length, POSTCARD_SAMPLES.length),
    select: {
      tmdbId: true,
      title: true,
      posterPath: true,
    },
  });

  if (movies.length === 0) return 0;

  let createdPostcards = 0;

  for (let index = 0; index < userIds.length; index += 1) {
    const ownerId = userIds[index]!;
    const movie = movies[index % movies.length]!;
    const sample = POSTCARD_SAMPLES[index % POSTCARD_SAMPLES.length]!;
    const posterPath = movie.posterPath
      ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
      : null;

    const existingPostcard = await prisma.postcard.findFirst({
      where: {
        userId: ownerId,
        tmdbId: movie.tmdbId,
        text: sample.text,
      },
    });

    const postcard =
      existingPostcard ??
      (await prisma.postcard.create({
        data: {
          userId: ownerId,
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
          .map((offset) => userIds[(index + offset) % userIds.length])
          .filter((userId): userId is string => userId !== ownerId),
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
      const existingComment = await prisma.postcardComment.findFirst({
        where: {
          postcardId: postcard.id,
          userId: commenterId,
          parentId: null,
          text: commentText,
        },
      });
      const comment =
        existingComment ??
        (await prisma.postcardComment.create({
          data: {
            postcardId: postcard.id,
            userId: commenterId,
            text: commentText,
          },
        }));

      if (!firstCommentId) firstCommentId = comment.id;
    }

    const replyAuthorId = userIds[(index + 3) % userIds.length];
    if (firstCommentId && replyAuthorId && replyAuthorId !== ownerId) {
      const replyText =
        POSTCARD_REPLY_SAMPLES[index % POSTCARD_REPLY_SAMPLES.length]!;
      const existingReply = await prisma.postcardComment.findFirst({
        where: {
          postcardId: postcard.id,
          userId: replyAuthorId,
          parentId: firstCommentId,
          text: replyText,
        },
      });

      if (!existingReply) {
        await prisma.postcardComment.create({
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

async function nextRegisterSeq(
  prisma: PrismaService,
  dateKey: string,
): Promise<number> {
  const prefix = `${DEMO_SEED.emailPrefix}+${dateKey}-`;
  const rows = await prisma.user.findMany({
    where: { email: { startsWith: prefix } },
    select: { email: true },
  });
  let max = 0;
  for (const row of rows) {
    const m = row.email.match(/-(\d+)@/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

async function findReturningUsers(
  prisma: PrismaService,
  limit: number,
): Promise<{ id: string; nickname: string; email: string }[]> {
  const { start, end } = kstTodayRange();
  const rows = await prisma.user.findMany({
    where: {
      email: { endsWith: `@${DEMO_SEED.emailDomain}` },
      NOT: {
        userMovies: {
          some: { createdAt: { gte: start, lt: end } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, nickname: true, email: true },
  });
  return rows.filter((r) => isDemoEmail(r.email));
}

async function main() {
  const password = assertEnv();
  const personas = loadPersonas();
  const dateKey = kstDateKey();
  const returnCount = Math.max(
    0,
    DEMO_SEED.totalActivity - DEMO_SEED.newPerDay,
  );

  console.log(
    `[demo-seed] KST ${dateKey} · 신규 ${DEMO_SEED.newPerDay} · 재방 ${returnCount}`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const auth = app.get(AuthService);
  const admin = app.get(AdminService);
  const ticket = app.get(TicketService);
  const lobby = app.get(LobbyBoardService);
  const prisma = app.get(PrismaService);
  const deps = { ticket, lobby, prisma };

  const results: SeedResult[] = [];
  const demoUserIds: string[] = [];

  try {
    let seq = await nextRegisterSeq(prisma, dateKey);
    for (let i = 0; i < DEMO_SEED.newPerDay; i++) {
      const email = demoEmail(dateKey, seq);
      const nickname = pickNickname(personas, dateKey, seq);
      seq += 1;

      const reg = await auth.register({ email, password, nickname });
      const userId = reg.user.id;
      demoUserIds.push(userId);
      console.log(`[demo-seed] register ${nickname} (${email})`);
      await seedProfile(auth, userId, personas);

      const r = await runUserActivity(userId, nickname, personas, deps);
      results.push(r);
      await sleep(DEMO_SEED.staggerMs);
    }

    const returning = await findReturningUsers(prisma, returnCount);
    if (returning.length < returnCount) {
      console.warn(
        `[demo-seed] 재방 유저 ${returning.length}/${returnCount} — demo 가입 이력이 적으면 신규 비율을 늘리거나 며칠 실행`,
      );
    }

    for (const user of returning) {
      demoUserIds.push(user.id);
      await admin.recordGuestLogin(user.id);
      console.log(`[demo-seed] login ${user.nickname}`);

      const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { tags: true },
      });
      if (!row?.tags.length) {
        await seedProfile(auth, user.id, personas);
      }

      const r = await runUserActivity(user.id, user.nickname, personas, deps);
      results.push(r);
      await sleep(DEMO_SEED.staggerMs);
    }

    const createdPostcards = await seedPostcardCommunity(prisma, demoUserIds);
    console.log(`  엽서 ${createdPostcards}건 · 댓글 작성자 시드 완료`);

    const ok = results.filter((r) => r.ok);
    const fail = results.filter((r) => !r.ok);
    console.log('\n[demo-seed] 완료');
    for (const r of ok) {
      if (r.ok) {
        console.log(`  ✓ ${r.nickname} · ${r.movieTitle} (${r.tmdbId})`);
      }
    }
    for (const r of fail) {
      console.log(`  − ${r.nickname} · ${r.reason}`);
    }
    console.log(`  활동 ${ok.length}건 / 스킵 ${fail.length}건`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('[demo-seed] 실패', err);
  process.exit(1);
});
