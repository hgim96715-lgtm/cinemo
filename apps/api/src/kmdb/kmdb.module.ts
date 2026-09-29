import { Module } from '@nestjs/common';
import { KmdbService } from './kmdb.service';
import { KmdbController } from './kmdb.controller';

@Module({
  controllers: [KmdbController],
  providers: [KmdbService],
  exports: [KmdbService],
})
export class KmdbModule {}
