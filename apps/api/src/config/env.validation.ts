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
  [EnvKeys.CLAUDE_KEY]: Joi.string().trim().min(1).optional(),
  [EnvKeys.CLAUDE_MODEL]: Joi.string().trim().optional(),
  [EnvKeys.OPENAI_KEY]: Joi.string().trim().min(1).optional(),
  [EnvKeys.OPENAI_MODEL]: Joi.string().trim().optional(),
  [EnvKeys.DEMO_SEED_ENABLED]: Joi.string().valid('1').optional(),
  [EnvKeys.DEMO_SEED_SECRET]: Joi.string().min(32).optional(),
  [EnvKeys.DEMO_SEED_PASSWORD]: Joi.string().min(8).optional(),
  [EnvKeys.TEST_USER_EMAIL]: Joi.string()
    .email({ tlds: { allow: false } })
    .optional(),
  [EnvKeys.TEST_USER_PASSWORD]: Joi.string().min(8).optional(),
  [EnvKeys.KAKAO_REST_API_KEY]: Joi.string().allow('').optional(),
  [EnvKeys.KAKAO_OAUTH_CLIENT_SECRET]: Joi.string().allow('').optional(),
  [EnvKeys.KAKAO_CALLBACK_URL]: Joi.string().uri().optional(),

  [EnvKeys.KOBIS_API_KEY]: Joi.string().trim().optional(),

  [EnvKeys.GOOGLE_CLIENT_ID]: Joi.string().optional(),
  [EnvKeys.GOOGLE_CLIENT_SECRET]: Joi.string().optional(),
  [EnvKeys.GOOGLE_CALLBACK_URL]: Joi.string().uri().optional(),

  [EnvKeys.NAVER_CLIENT_ID]: Joi.string().allow('').optional(),
  [EnvKeys.NAVER_CLIENT_SECRET]: Joi.string().allow('').optional(),
  [EnvKeys.NAVER_CALLBACK_URL]: Joi.string().uri().optional(),

  [EnvKeys.APPLE_CLIENT_ID]: Joi.string().allow('').optional(),
  [EnvKeys.APPLE_TEAM_ID]: Joi.string().allow('').optional(),
  [EnvKeys.APPLE_KEY_ID]: Joi.string().allow('').optional(),
  [EnvKeys.APPLE_PRIVATE_KEY]: Joi.string().allow('').optional(),
  [EnvKeys.APPLE_CALLBACK_URL]: Joi.string().uri().optional(),
});
