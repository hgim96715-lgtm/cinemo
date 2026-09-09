type MovieCalendarInput = {
  tmdbId: number;
  title: string;
  releaseDate: string;
  movieUrl?: string;
};

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

export function downloadMovieCalendarEvent({
  tmdbId,
  title,
  releaseDate,
  movieUrl,
}: MovieCalendarInput) {
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
    `DESCRIPTION:${escapeIcsText('CINEMO 개봉 예정 영화')}`,

    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P1D',
    `DESCRIPTION:${escapeIcsText(`${title} 개봉 하루 전`)}`,
    'END:VALARM',

    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([`${ics}\r\n`], {
    type: 'text/calendar;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${title.replace(/[\\/:*?"<>|]/g, '_')}.ics`;
  link.click();

  URL.revokeObjectURL(url);
}
