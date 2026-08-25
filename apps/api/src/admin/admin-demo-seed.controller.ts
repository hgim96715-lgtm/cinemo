import {
  Controller,
  Delete,
  DefaultValuePipe,
  Headers,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { DemoSeedService } from './demo-seed.service';

@ApiTags('admin-demo-seed')
@Controller('admin/demo-seed')
export class AdminDemoSeedController {
  constructor(private readonly demoSeedService: DemoSeedService) {}

  @Public()
  @Post()
  async run(
    @Headers('x-demo-seed-secret') secret: string | undefined,
    @Query('days', new DefaultValuePipe(1), ParseIntPipe) days: number,
  ) {
    if (
      process.env.DEMO_SEED_ENABLED !== '1' ||
      !process.env.DEMO_SEED_SECRET ||
      secret !== process.env.DEMO_SEED_SECRET
    ) {
      throw new UnauthorizedException('demo seed가 비활성화되어 있습니다.');
    }

    return this.demoSeedService.seedRecentDays(days);
  }

  @Public()
  @Delete()
  async purge(@Headers('x-demo-seed-secret') secret: string | undefined) {
    if (
      process.env.DEMO_SEED_ENABLED !== '1' ||
      !process.env.DEMO_SEED_SECRET ||
      secret !== process.env.DEMO_SEED_SECRET
    ) {
      throw new UnauthorizedException('demo seed가 비활성화되어 있습니다.');
    }

    return this.demoSeedService.purge();
  }
}
