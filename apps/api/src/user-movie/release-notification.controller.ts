import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

import { EnvKeys } from '../config/env.keys';
import { ConfigService } from '@nestjs/config';
import { UserMovieReleaseNotificationService } from './user-movie-release-notification.service';
import { ReleaseNotificationRunResponseDto } from './dto/release-notification-run-response.dto';

@ApiTags('release-notifications')
@Controller('release-notifications')
export class ReleaseNotificationController {
  constructor(
    private readonly releaseNotificationService: UserMovieReleaseNotificationService,
    private readonly configService: ConfigService,
  ) {}

  @ApiHeader({
    name: 'x-cron-secret',
    required: true,
    description: 'apps/api/.env의 CRON_SECRET 값',
  })
  @Public()
  @Post('cron')
  @ApiOperation({
    summary: '개봉일 알림 발송 실행',
    description: 'GitHub Actions 호출을 통한 발송 대상 개봉일 알림 처리',
  })
  @ApiOkResponse({ type: ReleaseNotificationRunResponseDto })
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
