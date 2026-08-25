import * as Joi from 'joi';
import { EnvKeys } from './env.keys';

export const envValidationSchema = Joi.object({
  [EnvKeys.PORT]: Joi.number().default(3050),
  [EnvKeys.FRONTEND_URL]: Joi.string().uri().required(),
  [EnvKeys.DATABASE_URL]: Joi.string().uri().required(),
  [EnvKeys.POSTGRES_PORT]: Joi.number().port().optional(),
  [EnvKeys.POSTGRES_USER]: Joi.string().optional(),
  [EnvKeys.POSTGRES_PASSWORD]: Joi.string().optional(),
  [EnvKeys.POSTGRES_DB]: Joi.string().optional(),
  [EnvKeys.API_JWT_SECRET]: Joi.string().min(16).required(),
  [EnvKeys.TMDB_ACCESS_TOKEN]: Joi.string().required(),
  [EnvKeys.TMDB_BASE_URL]: Joi.string()
    .uri()
    .default('https://api.themoviedb.org/3'),
  [EnvKeys.CRON_SECRET]: Joi.string().min(32).required(),
});
