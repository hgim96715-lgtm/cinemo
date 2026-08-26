import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { EnvKeys } from '../config/env.keys';

const BCRYPT_ROUNDS = 10;

async function main() {
  const email = process.env[EnvKeys.TEST_USER_EMAIL]?.trim().toLowerCase();
  const password = process.env[EnvKeys.TEST_USER_PASSWORD];

  if (!email || !password || password.length < 8) {
    throw new Error('TEST_USER_EMAIL과 TEST_USER_PASSWORD를 설정해주세요.');
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const nickname = 'cinemo-test';

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, nickname: true },
    });

    if (existing?.role === 'admin') {
      throw new Error('관리자 계정은 테스트 계정으로 바꿀 수 없습니다.');
    }

    const nicknameOwner = await prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });
    if (nicknameOwner && nicknameOwner.id !== existing?.id) {
      throw new Error('이미 사용 중인 닉네임입니다.');
    }
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            isTestAccount: true,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            passwordHash,
            nickname,
            role: 'user',
            isTestAccount: true,
          },
        });
    console.log(`[test-user] 준비 완료: ${user.email}`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('[test-user] 실패:', error);
  process.exitCode = 1;
});
