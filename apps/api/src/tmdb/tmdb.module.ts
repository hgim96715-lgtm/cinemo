import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [TmdbController],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
