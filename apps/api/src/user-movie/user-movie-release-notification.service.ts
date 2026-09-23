import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../auth/mail.service';
import { TmdbService } from '../tmdb/tmdb.service';
import {
  kstDateKey,
  todayKstDate,
  toKstDate,
} from '../lib/date-kst';
import { UpdateReleaseNotificationDto } from './dto/update-release-notification.dto';
import { ReleaseNotificationRunResponseDto } from './dto/release-notification-run-response.dto';

@Injectable()
export class UserMovieReleaseNotificationService {
  private readonly logger = new Logger(
    UserMovieReleaseNotificationService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly mailService: MailService,
  ) {}

  async getReleaseNotification(userId: string, tmdbId: number) {
    const notification = await this.prisma.movieReleaseNotification.findUnique({
      where: { userId_tmdbId: { userId, tmdbId } },
    });

    return {
      tmdbId,
      enabled: notification?.enabled ?? false,
      releaseDate: notification ? kstDateKey(notification.releaseDate) : null,
      sentAt: notification?.sentAt?.toISOString() ?? null,
    };
  }

  async updateReleaseNotification(
    userId: string,
    dto: UpdateReleaseNotificationDto,
  ) {
    const wish = await this.prisma.userMovie.findUnique({
      where: {
        userId_tmdbId_kind: {
          userId,
          tmdbId: dto.tmdbId,
          kind: 'wish',
        },
      },
    });

    if (!wish) {
      throw new BadRequestException(
        '보고 싶어요로 저장한 영화만 개봉일 알림을 설정할 수 있습니다.',
      );
    }

    const releaseDate = dto.releaseDate.trim();
    if (!releaseDate) {
      throw new BadRequestException('개봉일 정보가 없는 영화입니다.');
    }

    const existing = await this.prisma.movieReleaseNotification.findUnique({
      where: { userId_tmdbId: { userId, tmdbId: dto.tmdbId } },
    });
    const normalizedReleaseDate = toKstDate(
      new Date(`${releaseDate}T12:00:00+09:00`),
    );
    const releaseDateChanged =
      existing?.releaseDate.getTime() !== normalizedReleaseDate.getTime();

    const notification = await this.prisma.movieReleaseNotification.upsert({
      where: { userId_tmdbId: { userId, tmdbId: dto.tmdbId } },
      create: {
        userId,
        tmdbId: dto.tmdbId,
        releaseDate: normalizedReleaseDate,
        enabled: dto.enabled,
      },
      update: {
        releaseDate: normalizedReleaseDate,
        enabled: dto.enabled,
        ...(releaseDateChanged ? { sentAt: null } : {}),
      },
    });

    return {
      tmdbId: notification.tmdbId,
      enabled: notification.enabled,
      releaseDate,
      sentAt: notification.sentAt,
    };
  }

  async findDueReleaseNotifications() {
    return this.prisma.movieReleaseNotification.findMany({
      where: {
        enabled: true,
        sentAt: null,
        releaseDate: { lte: todayKstDate() },
      },
      orderBy: { releaseDate: 'asc' },
      take: 100,
      select: {
        id: true,
        tmdbId: true,
        releaseDate: true,
        user: { select: { email: true, nickname: true } },
      },
    });
  }

  async sendDueReleaseNotifications(): Promise<ReleaseNotificationRunResponseDto> {
    const notifications = await this.findDueReleaseNotifications();
    let sent = 0;
    let failed = 0;
    const failures: ReleaseNotificationRunResponseDto['failures'] = [];

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
