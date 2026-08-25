import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { AiModule } from '../ai/ai.module';
import { SeedRunService } from './seed-run.service';

@Module({
  imports: [AiModule],
  controllers: [TmdbController],
  providers: [TmdbService, SeedRunService],
  exports: [TmdbService, SeedRunService],
})
export class TmdbModule {}
