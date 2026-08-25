import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminDailyExcelService } from './admin-daily-excel.service';
import { AdminReportController } from './admin-report.controller';

@Module({
  controllers: [AdminController, AdminReportController],
  providers: [AdminService, AdminDailyExcelService],
  exports: [AdminService, AdminDailyExcelService],
})
export class AdminModule {}
