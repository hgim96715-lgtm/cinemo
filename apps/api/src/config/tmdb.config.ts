import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('tmdb', () => ({
  accessToken: process.env[EnvKeys.TMDB_ACCESS_TOKEN],
  baseUrl: process.env[EnvKeys.TMDB_BASE_URL],
  kobisApiKey: process.env[EnvKeys.KOBIS_API_KEY],
}));
