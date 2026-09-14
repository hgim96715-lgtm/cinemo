export function kstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function kstYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
}

export function kstYear(date = new Date()) {
  return kstYearMonth(date).year;
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatKstLongDate(dateKey: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'long',
  }).format(new Date(`${dateKey}T00:00:00+09:00`));
}

export function formatKstMonthDay(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
  })
    .format(toDate(value))
    .replace('-', '.');
}

export function formatKstDateDots(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(toDate(value))
    .replaceAll('-', '.');
}

export function formatKstDate(value: string | Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(toDate(value));
}

export function formatKstDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(toDate(value));
}

export function formatKstDayTime(value: string | Date) {
  const date = toDate(value);
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  })
    .format(date)
    .slice(5)
    .replace('-', '/');
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

  return `${day} ${time}`;
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
