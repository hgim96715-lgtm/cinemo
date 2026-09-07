import { Module } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './ai.interface';
import { OpenAiService } from './openai.service';

@Module({
  providers: [
    { provide: AI_PROVIDER, useClass: ClaudeService },
    // { provide: AI_PROVIDER, useClass: OpenAiService },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
