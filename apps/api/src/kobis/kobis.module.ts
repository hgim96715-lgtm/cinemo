import { Module } from '@nestjs/common';
import { KobisService } from './kobis.service';
import { KobisController } from './kobis.controller';

@Module({
  controllers: [KobisController],
  providers: [KobisService],
  exports: [KobisService],
})
export class KobisModule {}
