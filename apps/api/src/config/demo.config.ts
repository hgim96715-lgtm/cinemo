import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('demo', () => ({
  enabled: process.env[EnvKeys.DEMO_SEED_ENABLED] === '1',
  secret: process.env[EnvKeys.DEMO_SEED_SECRET],
  password: process.env[EnvKeys.DEMO_SEED_PASSWORD],
  testUserEmail: process.env[EnvKeys.TEST_USER_EMAIL],
  testUserPassword: process.env[EnvKeys.TEST_USER_PASSWORD],
}));
