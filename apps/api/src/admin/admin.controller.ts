import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('people/feed')
  getPeopleFeed(@Query('skip') skip?: string) {
    const parsed = Number(skip ?? 0);
    return this.adminService.getPeopleFeed(
      Number.isFinite(parsed) ? parsed : 0,
    );
  }

  @Get('people')
  getPeople() {
    return this.adminService.getPeople();
  }

  @Get('analytics')
  getAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getAnalytics(from, to);
  }
}
