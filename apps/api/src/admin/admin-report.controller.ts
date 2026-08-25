import {
  Controller,
  Get,
  Post,
  StreamableFile,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminDailyExcelService } from './admin-daily-excel.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('admin-reports')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/reports')
export class AdminReportController {
  constructor(
    private readonly adminDailyExcelService: AdminDailyExcelService,
  ) {}

  @Get('daily-excel')
  async downloadYesterdayExcel(): Promise<StreamableFile> {
    const report = await this.adminDailyExcelService.createYesterdayWorkbook();
    return this.toDownload(report);
  }

  @Get('daily-excel/status')
  async getYesterdayExcelStatus() {
    const report = await this.adminDailyExcelService.getYesterdayReport();

    return { report };
  }

  @Public()
  @Post('daily-excel/cron')
  async downloadYesterdayExcelForCron(
    @Headers('x-cron-secret') secret: string | undefined,
  ): Promise<StreamableFile> {
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('잘못된 cron secret입니다.');
    }
    const report = await this.adminDailyExcelService.createYesterdayWorkbook();
    return this.toDownload(report);
  }

  private toDownload(report: {
    buffer: Buffer;
    filename: string;
  }): StreamableFile {
    return new StreamableFile(report.buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${report.filename}"`,
      length: report.buffer.length,
    });
  }
}
