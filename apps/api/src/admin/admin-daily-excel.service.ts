import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { formatKst, kstDateKey, kstDayRange, toKstDate } from '../lib/date-kst';

@Injectable()
export class AdminDailyExcelService {
  constructor(private readonly prisma: PrismaService) {}

  async createYesterdayWorkbook(
    now = new Date(),
  ): Promise<{ date: string; filename: string; buffer: Buffer }> {
    const todayKey = kstDateKey(now);
    const yesterday = new Date(
      kstDayRange(todayKey).start.getTime() - 86_400_000,
    );
    const dateKey = kstDateKey(yesterday);
    const date = toKstDate(yesterday);
    const range = kstDayRange(dateKey);
    const filename = `cinemo-${dateKey}.xlsx`;

    const report = await this.prisma.adminDailyReport.upsert({
      where: { reportDate: date },
      create: {
        reportDate: date,
        status: 'running',
        filename,
      },
      update: {
        status: 'running',
        filename,
        dailyRowCount: 0,
        hourlyRowCount: 0,
        visitRowCount: 0,
        loginRowCount: 0,
        errorMessage: null,
        startedAt: new Date(),
        finishedAt: null,
      },
    });

    try {
      const [daily, hourly, visits, logins] = await Promise.all([
        this.prisma.adminDailyStat.findUnique({ where: { date } }),
        this.prisma.adminHourlyStat.findMany({
          where: { date },
          orderBy: { hour: 'asc' },
        }),
        this.prisma.lobbyVisit.findMany({
          where: {
            visitDate: date,
            user: { role: 'user', isTestAccount: false },
          },
          orderBy: { visitedAt: 'asc' },
          include: {
            user: {
              select: { nickname: true },
            },
          },
        }),
        this.prisma.adminLoginLog.findMany({
          where: {
            loggedAt: { gte: range.start, lt: range.end },
            user: { role: 'user', isTestAccount: false },
          },
          orderBy: { loggedAt: 'asc' },
          include: { user: { select: { nickname: true } } },
        }),
      ]);

      const workbook = XLSX.utils.book_new();
      const dailySheet = XLSX.utils.json_to_sheet([
        {
          날짜: dateKey,
          방문: daily?.visits ?? 0,
          로그인: daily?.logins ?? 0,
          티켓발급: daily?.ticketsIssued ?? 0,
          티켓사용: daily?.ticketsUsed ?? 0,
          후기: daily?.reviews ?? 0,
          카페메시지: daily?.cafeMessages ?? 0,
        },
      ]);
      const hourlySheet = XLSX.utils.json_to_sheet(
        hourly.map((row) => ({
          날짜: dateKey,
          시간: `${String(row.hour).padStart(2, '0')}:00`,
          방문: row.visits,
          로그인: row.logins,
          카페메시지: row.cafeMessages,
        })),
      );
      const visitSheet = XLSX.utils.json_to_sheet(
        visits.map((row) => ({
          닉네임: row.user.nickname,
          입장시각: formatKst(row.visitedAt),
        })),
      );
      const loginSheet = XLSX.utils.json_to_sheet(
        logins.map((row) => ({
          닉네임: row.user.nickname,
          로그인시각: formatKst(row.loggedAt),
        })),
      );

      XLSX.utils.book_append_sheet(workbook, dailySheet, '일일 통계');
      XLSX.utils.book_append_sheet(workbook, hourlySheet, '시간대 통계');
      XLSX.utils.book_append_sheet(workbook, visitSheet, '로비 입장');
      XLSX.utils.book_append_sheet(workbook, loginSheet, '로그인 기록');

      const buffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'buffer',
      }) as Buffer;

      await this.prisma.adminDailyReport.update({
        where: { id: report.id },
        data: {
          status: 'succeeded',
          dailyRowCount: daily ? 1 : 0,
          hourlyRowCount: hourly.length,
          visitRowCount: visits.length,
          loginRowCount: logins.length,
          finishedAt: new Date(),
          errorMessage: null,
        },
      });
      return {
        date: dateKey,
        filename,
        buffer,
      };
    } catch (error) {
      await this.prisma.adminDailyReport.update({
        where: { id: report.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async getYesterdayReport(now = new Date()) {
    const todayKey = kstDateKey(now);
    const yesterday = new Date(
      kstDayRange(todayKey).start.getTime() - 86_400_000,
    );
    const reportDate = toKstDate(yesterday);
    const report = await this.prisma.adminDailyReport.findUnique({
      where: { reportDate },
    });
    if (!report) return null;

    return {
      id: report.id,
      date: kstDateKey(report.reportDate),
      status: report.status,
      filename: report.filename,
      dailyRowCount: report.dailyRowCount,
      hourlyRowCount: report.hourlyRowCount,
      visitRowCount: report.visitRowCount,
      loginRowCount: report.loginRowCount,
      errorMessage: report.errorMessage,
      startedAt: report.startedAt.toISOString(),
      finishedAt: report.finishedAt?.toISOString() ?? null,
    };
  }
}
