import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../auth/mail.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { UserMovieService } from './user-movie.service';
import { kstDateKey } from '../lib/date-kst';

export type ReleaseNotificationRunResult = {
  total: number;
  sent: number;
  failed: number;
  failures: Array<{
    notificationId: string;
    tmdbId: number;
    reason: string;
  }>;
};

@Injectable()
export class ReleaseNotificationService {
  private readonly logger = new Logger(ReleaseNotificationService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMovieService: UserMovieService,
    private readonly tmdbService: TmdbService,
    private readonly mailService: MailService,
  ) {}

  async sendDueReleaseNotifications(): Promise<ReleaseNotificationRunResult> {
    const notifications =
      await this.userMovieService.findDueReleaseNotifications();
    let sent = 0;
    let failed = 0;
    const failures: ReleaseNotificationRunResult['failures'] = [];

    this.logger.log(`개봉일 알림 발송 대상: ${notifications.length}건`);

    for (const notification of notifications) {
      try {
        const movie = await this.tmdbService.getMovieCached(
          notification.tmdbId,
        );
        await this.mailService.sendReleaseNotificationEmail({
          to: notification.user.email,
          nickname: notification.user.nickname,
          title: movie.title,
          releaseDate: kstDateKey(notification.releaseDate),
        });

        await this.prisma.movieReleaseNotification.update({
          where: { id: notification.id },
          data: { sentAt: new Date() },
        });
        sent += 1;
      } catch (error: unknown) {
        failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        failures.push({
          notificationId: notification.id,
          tmdbId: notification.tmdbId,
          reason,
        });
        this.logger.error(
          `개봉일 알림 발송 실패: tmdbId=${notification.tmdbId}`,
          error instanceof Error ? error.stack : reason,
        );
      }
    }

    this.logger.log(`개봉일 알림 발송 결과: 성공 ${sent}건, 실패 ${failed}건`);

    return {
      total: notifications.length,
      sent,
      failed,
      failures,
    };
  }
}
