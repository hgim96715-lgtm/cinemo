import { Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { RegionPublicController } from './region-public.controller';

@Module({
  controllers: [RegionController, RegionPublicController],
  providers: [RegionService],
})
export class RegionModule {}
