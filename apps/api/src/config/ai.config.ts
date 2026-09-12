import { registerAs } from '@nestjs/config';
import { EnvKeys } from './env.keys';

export default registerAs('ai', () => ({
  claudeKey: process.env[EnvKeys.CLAUDE_KEY],
  claudeModel: process.env[EnvKeys.CLAUDE_MODEL] ?? 'claude-haiku-4-5',
  openaiKey: process.env[EnvKeys.OPENAI_KEY],
  openaiModel: process.env[EnvKeys.OPENAI_MODEL] ?? 'gpt-5-mini',
}));
