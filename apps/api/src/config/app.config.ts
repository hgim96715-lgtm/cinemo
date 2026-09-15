import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export type AppEnvironment = 'local' | 'staging' | 'production';

export default registerAs('app', () => {
  const appEnv =
    process.env[EnvKeys.APP_ENV] ??
    (process.env[EnvKeys.NODE_ENV] === 'production' ? 'production' : 'local');

  return {
    env: appEnv as AppEnvironment,
  };
});
