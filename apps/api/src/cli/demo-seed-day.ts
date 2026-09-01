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
import { ReviewPostService } from '../review-post/review-post.service';
import { LobbyBoardService } from '../lobby-board/lobby-board.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  kstDateKey,
  kstTodayRange,
  todayKstDate,
} from '../lib/date-kst';
import {
  DEMO_SEED,
  demoEmail,
  disposableDemoSeedDir,
  isDemoEmail,
} from './demo-seed-config';
import { seedDemoReviewLikes } from '../lib/demo-review-likes';

type Personas = {
  nicknames: string[];
  reviews: { body: string; rating: number }[];
  quotes: { text: string }[];
  profiles: {
    bio: string | null;
    tags: string[];
    profilePublic: boolean;
  }[];
};

type ReviewTemplate = { body: string; rating: number };
type QuoteTemplate = { text: string };
type ProfileTemplate = Personas['profiles'][number];

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

function pickQuote(personas: Personas): QuoteTemplate | undefined {
  return personas.quotes[Math.floor(Math.random() * personas.quotes.length)];
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
      quoteCreated: boolean;
    }
  | { ok: false; nickname: string; reason: string };

async function runUserActivity(
  userId: string,
  nickname: string,
  personas: Personas,
  deps: {
    ticket: TicketService;
    review: ReviewPostService;
    lobby: LobbyBoardService;
    prisma: PrismaService;
  },
): Promise<SeedResult> {
  const { start, end } = kstTodayRange();
  const postedToday = await deps.prisma.reviewPost.findFirst({
    where: { userId, createdAt: { gte: start, lt: end } },
  });
  if (postedToday) {
    return { ok: false, nickname, reason: '오늘 후기 이미 작성' };
  }

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
  await deps.review.create(userId, {
    tmdbId,
    body: template.body,
    rating: template.rating,
  });

  const quoteTemplate = pickQuote(personas);
  if (!quoteTemplate) {
    return { ok: true, nickname, movieTitle, tmdbId, quoteCreated: false };
  }

  const existingQuote = await deps.prisma.quotePost.findFirst({
    where: { userId, tmdbId, text: quoteTemplate.text },
    select: { id: true },
  });
  let quoteCreated = false;
  if (!existingQuote) {
    const quote = await deps.prisma.quotePost.create({
      data: {
        userId,
        tmdbId,
        movieTitle,
        text: quoteTemplate.text,
        usePosterBackground: true,
      },
    });
    await deps.prisma.quotePostBookmark.create({
      data: { userId, quotePostId: quote.id },
    });
    quoteCreated = true;
  }

  return { ok: true, nickname, movieTitle, tmdbId, quoteCreated };
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
        reviewPosts: {
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
  const returnCount = Math.max(0, DEMO_SEED.totalActivity - DEMO_SEED.newPerDay);

  console.log(
    `[demo-seed] KST ${dateKey} · 신규 ${DEMO_SEED.newPerDay} · 재방 ${returnCount}`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const auth = app.get(AuthService);
  const admin = app.get(AdminService);
  const ticket = app.get(TicketService);
  const review = app.get(ReviewPostService);
  const lobby = app.get(LobbyBoardService);
  const prisma = app.get(PrismaService);
  const deps = { ticket, review, lobby, prisma };

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

    const ok = results.filter((r) => r.ok);
    const fail = results.filter((r) => !r.ok);
    const reviewLikes = await seedDemoReviewLikes(
      prisma,
      dateKey,
      demoUserIds,
    );
    const quotePosts = ok.filter((r) => r.quoteCreated).length;

    console.log('\n[demo-seed] 완료');
    for (const r of ok) {
      if (r.ok) {
        console.log(`  ✓ ${r.nickname} · ${r.movieTitle} (${r.tmdbId})`);
      }
    }
    for (const r of fail) {
      console.log(`  − ${r.nickname} · ${r.reason}`);
    }
    console.log(`  후기 ${ok.length}건 / 스킵 ${fail.length}건`);
    console.log(`  명대사 ${quotePosts}건`);
    console.log(`  좋아요 ${reviewLikes}건`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('[demo-seed] 실패', err);
  process.exit(1);
});
