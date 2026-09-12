import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('auth', () => {
  const secret = process.env[EnvKeys.API_JWT_SECRET]?.trim();
  const frontendUrl = process.env[EnvKeys.FRONTEND_URL]?.trim();

  if (!secret) {
    throw new Error(`${EnvKeys.API_JWT_SECRET}가 설정되지 않았습니다.`);
  }

  if (!frontendUrl) {
    throw new Error(`${EnvKeys.FRONTEND_URL}가 설정되지 않았습니다.`);
  }

  return {
    secret,
    frontendUrl,
    expiresIn: '7d' as const,
  };
});
