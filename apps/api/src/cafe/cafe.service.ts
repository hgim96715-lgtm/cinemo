import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CAFE_TABLE_SLOTS,
  DEFAULT_CAFE_NOTICE_RULES,
  UpdateCafeNoticeInput,
  type CafeNotice,
  type CafeHallResponse,
  type CafeMessageItem,
  type CafeSitResult,
  type CafeStandResult,
  type CafeTableChatResponse,
  type CafeTableId,
  type CafeTableSetup,
  type CafeTableSnapshot,
} from '@cinemo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { cafeDayRange } from '../lib/date-kst';
import {
  applyFirstSeatSetup,
  canJoinCafeTable,
  isCafeTableId,
} from './cafe-join';
import { CafeGateway } from './cafe.gateway';
import { AdminService } from '../admin/admin.service';

export const CAFE_MESSAGE_RECENT_LIMIT = 50;

@Injectable()
export class CafeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cafeGateway: CafeGateway,
    private readonly adminService: AdminService,
  ) {}

  private toNotice(row: {
    id: string;
    key: string;
    kicker: string;
    title: string;
    rules: string[];
    createdAt: Date;
    updatedAt: Date;
  }): CafeNotice {
    return {
      id: row.id,
      key: row.key,
      kicker: row.kicker,
      title: row.title,
      rules: row.rules,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async ensureCafeNotice(): Promise<void> {
    await this.prisma.cafeNotice.upsert({
      where: { key: 'cafe' },
      create: { key: 'cafe', rules: [...DEFAULT_CAFE_NOTICE_RULES] },
      update: {},
    });
  }

  async getNotice(): Promise<CafeNotice> {
    await this.ensureCafeNotice();
    const row = await this.prisma.cafeNotice.findUniqueOrThrow({
      where: { key: 'cafe' },
    });
    return this.toNotice(row);
  }

  async updateNotice(input: UpdateCafeNoticeInput): Promise<CafeNotice> {
    await this.ensureCafeNotice();
    const rules = input.rules?.map((line) => line.trim()).filter(Boolean);
    const row = await this.prisma.cafeNotice.update({
      where: { key: 'cafe' },
      data: {
        ...(input.kicker !== undefined ? { kicker: input.kicker.trim() } : {}),
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(rules !== undefined ? { rules } : {}),
      },
    });
    return this.toNotice(row);
  }

  private async closeIfNewCafeDay(now = new Date()): Promise<boolean> {
    const { start } = cafeDayRange(now);

    const [pastSeatCount, pastMessage] = await Promise.all([
      this.prisma.cafeTableSeat.count({
        where: { joinedAt: { lt: start } },
      }),
      this.prisma.cafeMessage.findFirst({
        where: { createdAt: { lt: start } },
        select: { id: true },
      }),
    ]);

    if (pastSeatCount === 0 && !pastMessage) return false;

    let purgedSeats = false;

    await this.prisma.$transaction(async (tx) => {
      if (pastMessage) {
        await tx.cafeMessage.deleteMany({
          where: { createdAt: { lt: start } },
        });
      }

      if (pastSeatCount > 0) {
        await tx.cafeTableSeat.deleteMany({
          where: { joinedAt: { lt: start } },
        });
        purgedSeats = true;

        const emptySessions = await tx.cafeTableSession.findMany({
          where: {
            seats: { none: {} },
          },
          select: { tableId: true },
        });
        if (emptySessions.length > 0) {
          await tx.cafeTableSession.updateMany({
            where: {
              tableId: { in: emptySessions.map((row) => row.tableId) },
            },
            data: { label: null, access: 'open' },
          });
        }
      }
    });

    if (purgedSeats) {
      const hall = await this.getHallSnapshotDirect(now);
      this.cafeGateway.emitHall(hall);
    }

    return purgedSeats;
  }

  /** tableId가 유효한지 검증 */
  private assertTableId(tableId: string): asserts tableId is CafeTableId {
    if (!isCafeTableId(tableId))
      throw new BadRequestException('유효하지 않은 테이블 ID입니다.');
  }

  private toSnapshot(row: {
    tableId: string;
    label: string | null;
    access: 'open' | 'locked';
    _count: { seats: number };
  }): CafeTableSnapshot {
    return {
      tableId: row.tableId as CafeTableId,
      label: row.label,
      access: row.access,
      seatedCount: row._count.seats,
    };
  }

  private toSnapshotFromSeats(row: {
    tableId: string;
    label: string | null;
    access: 'open' | 'locked';
    seats: { userId: string }[];
  }): CafeTableSnapshot {
    return {
      tableId: row.tableId as CafeTableId,
      label: row.label,
      access: row.access,
      seatedCount: row.seats.length,
    };
  }

  private toMessageItem(row: {
    id: string;
    tableId: string;
    userId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    user: { nickname: string };
  }): CafeMessageItem {
    return {
      id: row.id,
      tableId: row.tableId as CafeTableId,
      userId: row.userId,
      nickname: row.user.nickname,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async ensureSeat(
    tableId: CafeTableId,
    userId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    try {
      await tx.cafeTableSeat.upsert({
        where: { tableId_userId: { tableId, userId } },
        create: { tableId, userId },
        update: {},
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await tx.cafeTableSeat.findUnique({
          where: { tableId_userId: { tableId, userId } },
        });
        if (existing) return;
      }
      throw error;
    }
  }

  private async ensureTableSessions(): Promise<void> {
    await this.prisma.cafeTableSession.createMany({
      data: CAFE_TABLE_SLOTS.map((tableId) => ({ tableId })),
      skipDuplicates: true,
    });
  }

  private async getHallSnapshotDirect(
    now = new Date(),
  ): Promise<CafeHallResponse> {
    // closeIfNewCafeDay 내부에서 호출할 “직접 스냅샷” 쿼리.
    // getHall()을 쓰면 closeIfNewCafeDay()가 또 호출되어 루프/중복이 생길 수 있음.
    void now;
    await this.ensureTableSessions();

    const rows = await this.prisma.cafeTableSession.findMany({
      where: { tableId: { in: [...CAFE_TABLE_SLOTS] } },
      include: { _count: { select: { seats: true } } },
      orderBy: { tableId: 'asc' },
    });

    return {
      tables: rows.map((row) => this.toSnapshot(row)),
      cafeJustClosed: false,
      myTableId: null,
    };
  }

  async getHall(userId?: string, now = new Date()): Promise<CafeHallResponse> {
    const cafeJustClosed = await this.closeIfNewCafeDay(now);
    await this.ensureTableSessions();
    const rows = await this.prisma.cafeTableSession.findMany({
      where: { tableId: { in: [...CAFE_TABLE_SLOTS] } },
      include: { _count: { select: { seats: true } } },
      orderBy: { tableId: 'asc' },
    });

    let myTableId: CafeTableId | null = null;
    if (userId) {
      const seat = await this.prisma.cafeTableSeat.findFirst({
        where: { userId },
        select: { tableId: true },
      });
      if (seat && isCafeTableId(seat.tableId)) {
        myTableId = seat.tableId;
      }
    }

    return {
      tables: rows.map((row) => this.toSnapshot(row)),
      cafeJustClosed,
      myTableId,
    };
  }

  async getTableChat(
    tableId: CafeTableId,
    now = new Date(),
  ): Promise<CafeTableChatResponse> {
    this.assertTableId(tableId);
    await this.ensureTableSessions();
    const cafeJustClosed = await this.closeIfNewCafeDay(now);
    const { start, end } = cafeDayRange(now);
    const rows = await this.prisma.cafeMessage.findMany({
      where: { tableId, createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'desc' },
      take: CAFE_MESSAGE_RECENT_LIMIT,
      include: { user: { select: { nickname: true } } },
    });
    return {
      messages: rows.reverse().map((row) => this.toMessageItem(row)),
      cafeJustClosed,
    };
  }

  async sit(
    tableId: CafeTableId,
    userId: string,
    setup?: CafeTableSetup,
    now = new Date(),
  ): Promise<CafeSitResult> {
    this.assertTableId(tableId);
    await this.ensureTableSessions();
    const cafeJustClosed = await this.closeIfNewCafeDay(now);
    const session = await this.prisma.cafeTableSession.findFirstOrThrow({
      where: { tableId },
      include: { seats: { select: { userId: true } } },
    });

    const snapshot = this.toSnapshotFromSeats(session);
    const seatedUserIds = session.seats.map((seat) => seat.userId);
    const check = canJoinCafeTable(snapshot, userId, seatedUserIds);
    if (!check.ok) return check;

    if (session.seats.some((seat) => seat.userId === userId)) {
      return { ok: true, snapshot, cafeJustClosed };
    }

    const otherSeat = await this.prisma.cafeTableSeat.findFirst({
      where: { userId },
      select: { tableId: true },
    });
    if (otherSeat) {
      return { ok: false, reason: 'already-seated' };
    }

    if (session.seats.length === 0) {
      const nextLabel = setup?.label?.trim() || null;
      if (nextLabel) {
        const duplicate = await this.prisma.cafeTableSession.findFirst({
          where: {
            tableId: { not: tableId },
            label: { equals: nextLabel, mode: 'insensitive' },
          },
        });
        if (duplicate)
          throw new BadRequestException('이미 사용 중인 테이블 이름이에요.');
      }
      const next = applyFirstSeatSetup(snapshot, setup);
      const shouldUpdateSession =
        setup?.label !== undefined ||
        setup?.access !== undefined ||
        snapshot.label === null;

      await this.prisma.$transaction(async (tx) => {
        if (shouldUpdateSession) {
          await tx.cafeTableSession.update({
            where: { tableId },
            data: { label: next.label, access: next.access },
          });
        }
        await this.ensureSeat(tableId, userId, tx);
      });
    } else {
      await this.ensureSeat(tableId, userId);
    }

    const updated = await this.prisma.cafeTableSession.findFirstOrThrow({
      where: { tableId },
      include: { _count: { select: { seats: true } } },
    });
    const nextSnapshot = this.toSnapshot(updated);
    this.cafeGateway.emitTableSnapshot(nextSnapshot);
    return { ok: true, snapshot: nextSnapshot, cafeJustClosed };
  }

  async stand(
    tableId: CafeTableId,
    userId: string,
    now = new Date(),
  ): Promise<CafeStandResult> {
    this.assertTableId(tableId);
    await this.ensureTableSessions();
    const cafeJustClosed = await this.closeIfNewCafeDay(now);

    await this.prisma.cafeTableSeat.deleteMany({
      where: { tableId, userId },
    });

    const remaining = await this.prisma.cafeTableSeat.count({
      where: { tableId },
    });

    if (remaining === 0) {
      const { start, end } = cafeDayRange(now);
      await this.prisma.$transaction([
        this.prisma.cafeTableSession.update({
          where: { tableId },
          data: { label: null, access: 'open' },
        }),
        this.prisma.cafeMessage.deleteMany({
          where: { tableId, createdAt: { gte: start, lt: end } },
        }),
      ]);
    }
    const updated = await this.prisma.cafeTableSession.findFirstOrThrow({
      where: { tableId },
      include: { _count: { select: { seats: true } } },
    });
    const snapshot = this.toSnapshot(updated);
    this.cafeGateway.emitTableSnapshot(snapshot);
    return { snapshot, cafeJustClosed };
  }

  async say(
    tableId: CafeTableId,
    userId: string,
    body: string,
    now = new Date(),
  ): Promise<CafeMessageItem> {
    this.assertTableId(tableId);
    await this.ensureTableSessions();
    await this.closeIfNewCafeDay(now);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('메시지를 입력해주세요.');

    const seated = await this.prisma.cafeTableSeat.findUnique({
      where: { tableId_userId: { tableId, userId } },
    });
    if (!seated) throw new BadRequestException('좌석에 앉아있지 않습니다.');

    const row = await this.prisma.cafeMessage.create({
      data: { tableId, userId, body: trimmed },
      include: { user: { select: { nickname: true } } },
    });
    const message = this.toMessageItem(row);
    this.cafeGateway.emitMessage(tableId, message);
    void this.adminService.countIncrement('cafeMessages', new Date(), userId);
    return message;
  }

  async updateMessage(
    userId: string,
    messageId: string,
    body: string,
    now = new Date(),
  ): Promise<CafeMessageItem> {
    await this.closeIfNewCafeDay(now);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('메시지를 입력해주세요.');

    const { start, end } = cafeDayRange(now);
    const existing = await this.prisma.cafeMessage.findFirst({
      where: { id: messageId, createdAt: { gte: start, lt: end } },
    });
    if (!existing) throw new NotFoundException('존재하지 않는 메시지입니다.');

    if (existing.userId !== userId)
      throw new ForbiddenException('수정 권한이 없습니다.');

    const row = await this.prisma.cafeMessage.update({
      where: { id: messageId },
      data: { body: trimmed },
      include: { user: { select: { nickname: true } } },
    });
    const message = this.toMessageItem(row);
    this.cafeGateway.emitMessage(message.tableId, message);
    return message;
  }

  async closeForNight(now = new Date()): Promise<CafeHallResponse> {
    const { start } = cafeDayRange(now);
    await this.prisma.cafeMessage.deleteMany({
      where: { createdAt: { lt: start } },
    });
    await this.prisma.cafeTableSeat.deleteMany();
    await this.prisma.cafeTableSession.updateMany({
      data: { label: null, access: 'open' },
    });
    const hall = await this.getHall(undefined, now);
    this.cafeGateway.emitHall(hall);
    return hall;
  }
}
