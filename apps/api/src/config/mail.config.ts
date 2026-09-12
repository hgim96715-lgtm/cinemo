import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('mail', () => ({
  resendApiKey: process.env[EnvKeys.RESEND_API_KEY],
  resendFrom: process.env[EnvKeys.RESEND_FROM],
}));
