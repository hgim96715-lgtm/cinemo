/**
 * demo 유저 및 연관 데이터 삭제
 *
 * ENABLE_DEMO_SEED=1 pnpm --filter api demo:purge
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_SEED } from './demo-seed-config';

function assertEnv() {
  if (process.env.NODE_ENV === 'production') {
    console.error('[demo-purge] production 환경에서는 실행할 수 없음');
    process.exit(1);
  }
  if (process.env.ENABLE_DEMO_SEED !== '1') {
    console.error('[demo-purge] ENABLE_DEMO_SEED=1 필요');
    process.exit(1);
  }
}

async function main() {
  assertEnv();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  try {
    const users = await prisma.user.findMany({
      where: { email: { endsWith: `@${DEMO_SEED.emailDomain}` } },
      select: { id: true, email: true, nickname: true },
    });

    if (users.length === 0) {
      console.log('[demo-purge] demo 유저 없음');
      return;
    }

    const ids = users.map((u) => u.id);

    await prisma.$transaction([
      prisma.ticket.deleteMany({ where: { userId: { in: ids } } }),
      prisma.userMovie.deleteMany({ where: { userId: { in: ids } } }),
      prisma.lobbyVisit.deleteMany({ where: { userId: { in: ids } } }),
      prisma.adminLoginLog.deleteMany({ where: { userId: { in: ids } } }),
      prisma.movieProviderOverride.deleteMany({
        where: { createdBy: { in: ids } },
      }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);

    console.log(`[demo-purge] ${users.length}명 삭제`);
    for (const u of users) {
      console.log(`  · ${u.nickname} ${u.email}`);
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('[demo-purge] 실패', err);
  process.exit(1);
});
