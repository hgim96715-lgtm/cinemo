import { NextRequest } from 'next/server';

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function getNextDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

  return nextDate.toISOString().slice(0, 10).replaceAll('-', '');
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tmdbId = params.get('tmdbId');
  const title = params.get('title');
  const releaseDate = params.get('releaseDate');

  if (
    !tmdbId ||
    !title ||
    !releaseDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)
  ) {
    return new Response('잘못된 캘린더 일정입니다.', { status: 400 });
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CINEMO//Movie Calendar//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:cinemo-${tmdbId}@cinemo`,
    `DTSTART;VALUE=DATE:${releaseDate.replaceAll('-', '')}`,
    `DTEND;VALUE=DATE:${getNextDate(releaseDate)}`,
    `SUMMARY:${escapeIcsText(`개봉 예정 · ${title}`)}`,
    'DESCRIPTION:CINEMO 개봉 예정 영화',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P1D',
    `DESCRIPTION:${escapeIcsText(`${title} 개봉 하루 전`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(`${ics}\r\n`, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="cinemo-${tmdbId}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
