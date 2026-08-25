import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminDailyExcelService } from './admin-daily-excel.service';
import { AdminReportController } from './admin-report.controller';
import { DemoSeedService } from './demo-seed.service';
import { AdminDemoSeedController } from './admin-demo-seed.controller';

@Module({
  controllers: [
    AdminController,
    AdminReportController,
    AdminDemoSeedController,
  ],
  providers: [AdminService, AdminDailyExcelService, DemoSeedService],
  exports: [AdminService, AdminDailyExcelService, DemoSeedService],
})
export class AdminModule {}
