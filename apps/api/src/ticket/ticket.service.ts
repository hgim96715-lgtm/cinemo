import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GACHA_TMDB_FILTERS,
  isGachaMachineId,
  type GachaMovie,
  type TicketStatus as SharedTicketStatus,
} from '@cinemo/shared';
import { todayKstDate } from '../lib/date-kst';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { AdminService } from '../admin/admin.service';
@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly adminService: AdminService,
  ) {}

  async getToday(userId: string): Promise<{
    status: SharedTicketStatus;
    machineId: string | null;
    tmdbId: number | null;
    movie: GachaMovie | null;
  }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        userId_ticketDate: { userId, ticketDate: todayKstDate() },
      },
    });
    if (!ticket)
      return { status: 'none', machineId: null, tmdbId: null, movie: null };
    const movie =
      ticket.status === 'used' && ticket.tmdbId != null
        ? await this.tmdbService.getMovieCached(ticket.tmdbId)
        : null;
    return {
      status: ticket.status,
      machineId: ticket.machineId,
      tmdbId: ticket.tmdbId,
      movie,
    };
  }

  async issueToday(userId: string) {
    const ticketDate = todayKstDate();
    const existing = await this.prisma.ticket.findUnique({
      where: { userId_ticketDate: { userId, ticketDate } },
    });
    if (existing) throw new ConflictException('이미 오늘 티켓을 발급했습니다.');
    const ticket = await this.prisma.ticket.create({
      data: { userId, ticketDate, status: 'issued', issuedAt: new Date() },
    });
    void this.adminService.countIncrement('ticketsIssued', new Date(), userId);
    return { id: ticket.id };
  }

  private async pickFromReviews(userId: string): Promise<GachaMovie> {
    const [reviewed, watched, alreadyPulled] = await Promise.all([
      this.prisma.reviewPost.findMany({
        distinct: ['tmdbId'],
        select: { tmdbId: true },
      }),

      this.prisma.userMovie.findMany({
        where: { userId, kind: 'watched' },
        select: { tmdbId: true },
      }),
      this.prisma.ticket.findMany({
        where: { userId, machineId: 'picks', status: 'used' },
        select: { tmdbId: true },
      }),
    ]);

    const excludeSet = new Set<number>([
      ...watched.map((row) => row.tmdbId),
      ...alreadyPulled
        .map((row) => row.tmdbId)
        .filter((id): id is number => id != null),
    ]);

    const pool = reviewed
      .map((row) => row.tmdbId)
      .filter((id) => !excludeSet.has(id));

    if (pool.length === 0) {
      throw new NotFoundException(
        '뽑을 수 있는 영화가 없어요. 후기가 더 쌓이면 다시 도전해보세요!',
      );
    }
    const tmdbId = pool[Math.floor(Math.random() * pool.length)];
    return this.tmdbService.getMovieCached(tmdbId);
  }

  async useToday(userId: string, machineId: string) {
    if (!isGachaMachineId(machineId)) {
      throw new BadRequestException('유효하지 않은 머신 ID입니다.');
    }
    const ticketDate = todayKstDate();
    const ticket = await this.prisma.ticket.findUnique({
      where: { userId_ticketDate: { userId, ticketDate } },
    });
    if (!ticket) throw new NotFoundException('오늘 발급된 티켓이 없습니다.');
    if (ticket.status === 'used')
      throw new ConflictException('이미 사용한 티켓입니다.');

    let movie: GachaMovie;

    if (machineId === 'picks') {
      movie = await this.pickFromReviews(userId);
    } else {
      const watched = await this.prisma.userMovie.findMany({
        where: { userId, kind: 'watched' },
        select: { tmdbId: true },
      });
      movie = await this.tmdbService.pickRandomMovie(
        GACHA_TMDB_FILTERS[machineId],
        watched.map((row) => row.tmdbId),
      );
    }
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'used', usedAt: new Date(), machineId, tmdbId: movie.id },
    });
    void this.adminService.countIncrement('ticketsUsed', new Date(), userId);
    return {
      status: 'used',
      machineId,
      movie,
    };
  }

  /** 테스트 계정만 오늘 티켓을 리셋할 수 있음 */
  async resetTodayForTestUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { isTestAccount: true },
    });
    if (!user.isTestAccount) {
      throw new ForbiddenException('테스트 계정만 리셋할 수 있습니다.');
    }
    await this.prisma.ticket.deleteMany({
      where: { userId, ticketDate: todayKstDate() },
    });
    return { status: 'none' as const };
  }
}
