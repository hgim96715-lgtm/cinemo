import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('kobis', () => ({
  apiKey: process.env[EnvKeys.KOBIS_API_KEY],
}));
