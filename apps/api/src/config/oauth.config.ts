import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('oauth', () => ({
  kakao: {
    restApiKey: process.env[EnvKeys.KAKAO_REST_API_KEY],
    clientSecret: process.env[EnvKeys.KAKAO_OAUTH_CLIENT_SECRET],
    callbackUrl: process.env[EnvKeys.KAKAO_CALLBACK_URL],
  },
  google: {
    clientId: process.env[EnvKeys.GOOGLE_CLIENT_ID],
    clientSecret: process.env[EnvKeys.GOOGLE_CLIENT_SECRET],
    callbackUrl: process.env[EnvKeys.GOOGLE_CALLBACK_URL],
  },
  naver: {
    clientId: process.env[EnvKeys.NAVER_CLIENT_ID],
    clientSecret: process.env[EnvKeys.NAVER_CLIENT_SECRET],
    callbackUrl: process.env[EnvKeys.NAVER_CALLBACK_URL],
  },
  apple: {
    clientId: process.env[EnvKeys.APPLE_CLIENT_ID],
    teamId: process.env[EnvKeys.APPLE_TEAM_ID],
    keyId: process.env[EnvKeys.APPLE_KEY_ID],
    privateKey: process.env[EnvKeys.APPLE_PRIVATE_KEY],
    callbackUrl: process.env[EnvKeys.APPLE_CALLBACK_URL],
  },
}));
