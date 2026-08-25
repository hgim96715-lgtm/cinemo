export function kstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function formatKstDateKey(dateKey: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${dateKey}T00:00:00+09:00`));
}

export function kstPreviousDateKey(now = new Date()) {
  const todayKey = kstDateKey(now);
  const todayStart = new Date(`${todayKey}T00:00:00+09:00`);
  return kstDateKey(new Date(todayStart.getTime() - 86400000));
}

/** 로비에서 시간 보이게 예: `2026년 8월 14일 · 금 · 16:12` */

export function kstLobbyDateLabel(date = new Date()) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => {
    return parts.find((part) => part.type === type)?.value || '';
  };
  return `${get('year')}년 ${get('month')} ${get('day')}일 · ${get('weekday')} · ${get('hour')}:${get('minute')}`;
}

/** 지난주 KST 월~일 라벨 — `8월 11일 ~ 8월 17일` */
export function kstPreviousWeekRangeLabel(now = new Date()) {
  const DAY_MS = 86400000;
  const todayKey = kstDateKey(now);
  const todayStart = new Date(`${todayKey}T00:00:00+09:00`);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  }).format(now);
  const monOffset =
    { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[weekday] ?? 0;
  const thisMon = new Date(todayStart.getTime() - monOffset * DAY_MS);
  const prevMon = new Date(thisMon.getTime() - 7 * DAY_MS);
  const prevSun = new Date(thisMon.getTime() - DAY_MS);

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
    }).format(d);

  return `${fmt(prevMon)} ~ ${fmt(prevSun)}`;
}
