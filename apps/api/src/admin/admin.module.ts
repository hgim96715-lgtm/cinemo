import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DemoSeedService } from './demo-seed.service';
import { AdminDemoSeedController } from './admin-demo-seed.controller';

@Module({
  controllers: [
    AdminController,
    AdminDemoSeedController,
  ],
  providers: [AdminService, DemoSeedService],
  exports: [AdminService, DemoSeedService],
})
export class AdminModule {}
