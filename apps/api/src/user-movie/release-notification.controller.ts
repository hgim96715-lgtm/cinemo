import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

import { EnvKeys } from '../config/env.keys';
import { ConfigService } from '@nestjs/config';
import { ReleaseNotificationService } from './release-notification.service';

@ApiTags('release-notifications')
@Controller('release-notifications')
export class ReleaseNotificationController {
  constructor(
    private readonly releaseNotificationService: ReleaseNotificationService,
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
      EnvKeys.CRON_SECRET,
    );
    if (secret !== cronSecret) {
      throw new UnauthorizedException('잘못된 cron secret입니다.');
    }

    const result =
      await this.releaseNotificationService.sendDueReleaseNotifications();

    return {
      message:
        result.total === 0
          ? '발송 대상 개봉일 알림이 없습니다.'
          : '개봉일 알림 크론을 처리했습니다.',
      ...result,
    };
  }
}
