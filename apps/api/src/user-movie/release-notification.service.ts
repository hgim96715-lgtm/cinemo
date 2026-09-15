import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../auth/mail.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { UserMovieService } from './user-movie.service';
import { kstDateKey } from '../lib/date-kst';

@Injectable()
export class ReleaseNotificationService {
  private readonly logger = new Logger(ReleaseNotificationService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMovieService: UserMovieService,
    private readonly tmdbService: TmdbService,
    private readonly mailService: MailService,
  ) {}

  async sendDueReleaseNotifications() {
    const notifications =
      await this.userMovieService.findDueReleaseNotifications();

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
      } catch (error: unknown) {
        this.logger.error(
          `개봉일 알림 발송 실패: tmdbId=${notification.tmdbId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
