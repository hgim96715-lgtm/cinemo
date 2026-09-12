import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('database', () => ({
  url: process.env[EnvKeys.DATABASE_URL],
}));
