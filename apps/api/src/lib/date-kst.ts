/** Asia/Seoul 달력 하루 (ms) */
const DAY_MS = 86400000;

/** KST 달력일 `"2026-08-12"` */
export function kstDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(date);
}

/** 임의 시각 → Prisma `@db.Date` (UTC 자정 Date) */
export function toKstDate(instant: Date = new Date()): Date {
  return new Date(`${kstDateKey(instant)}T00:00:00.000Z`);
}

/** 오늘 KST → Prisma `@db.Date` */
export function todayKstDate(): Date {
  return toKstDate();
}

/** KST 달력 하루 `[start, end)` — Timestamptz 필터용 · 00:00 */
export function kstDayRange(day: string): { start: Date; end: Date } {
  const start = new Date(`${day}T00:00:00+09:00`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** 오늘 KST `[start, end)` */
export function kstTodayRange(now = new Date()): { start: Date; end: Date } {
  return kstDayRange(kstDateKey(now));
}

/** KST 이번 주 월요일 00:00 ~ 다음 월요일 00:00 */
export function kstWeekRange(now = new Date()): { start: Date; end: Date } {
  const { start: todayStart } = kstTodayRange(now);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  }).format(now);
  const monOffset =
    {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    }[weekday] ?? 0;
  const start = new Date(todayStart.getTime() - monOffset * DAY_MS);
  return { start, end: new Date(start.getTime() + 7 * DAY_MS) };
}

/** inclusive `"2026-08-12"` … `"2026-08-18"` */
export function kstDayKeys(from: string, to: string): string[] {
  const keys: string[] = [];
  let t = kstDayRange(from).start.getTime();
  const end = kstDayRange(to).start.getTime();
  while (t <= end) {
    keys.push(kstDateKey(new Date(t)));
    t += DAY_MS;
  }
  return keys;
}

/** KST 02:00 마감 — 0~1시는 전날 수다로 취급 */
export function cafeDayKey(now = new Date()): string {
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  if (kst.getHours() < 2) kst.setDate(kst.getDate() - 1);
  return kstDateKey(kst);
}

/** 카페 하루 `[start, end)` — 02:00 */
export function cafeDayRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(`${cafeDayKey(now)}T02:00:00+09:00`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** KST 시간 (0~23) */
export function kstHour(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now),
  );
}

/** KST 지난주 월요일 00:00 ~ 이번 주 월요일 00:00 */
export function kstPreviousWeekRange(now = new Date()): {
  start: Date;
  end: Date;
} {
  const { start, end } = kstWeekRange(now);
  return {
    start: new Date(start.getTime() - 7 * DAY_MS),
    end: start,
  };
}

export function formatKst(value: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(value);
}
