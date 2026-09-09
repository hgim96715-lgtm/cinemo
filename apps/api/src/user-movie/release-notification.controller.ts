import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ReleaseNotificationCron } from './release-notification.cron';
import { EnvKeys } from '../config/env.keys';
import { ConfigService } from '@nestjs/config';

@ApiTags('release-notifications')
@Controller('release-notifications')
export class ReleaseNotificationController {
  constructor(
    private readonly releaseNotificationCron: ReleaseNotificationCron,
    private readonly configService: ConfigService,
  ) {}

  @ApiHeader({
    name: 'x-cron-secret',
    required: true,
    description: 'apps/api/.env의 CRON_SECRET 값',
  })
  @Public()
  @Post('cron')
  async runForTest(@Headers('x-cron-secret') secret: string | undefined) {
    const cronSecret = this.configService.getOrThrow<string>(
      EnvKeys.NEST_CRON_SECRET,
    );
    if (secret !== cronSecret) {
      throw new UnauthorizedException('잘못된 cron secret입니다.');
    }

    await this.releaseNotificationCron.sendDueReleaseNotifications();

    return {
      message: '개봉일 알림 크론을 실행했습니다.',
    };
  }
}
