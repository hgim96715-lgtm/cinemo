const audienceFormatter = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatAudienceCount(count: number) {
  if (count < 10_000) {
    return `${audienceFormatter.format(count)}명`;
  }

  const value = Math.floor((count / 10_000) * 10) / 10;

  return `${value.toLocaleString('ko-KR', {
    maximumFractionDigits: 1,
  })}만명`;
}
