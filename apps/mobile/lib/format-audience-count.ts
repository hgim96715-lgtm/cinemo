const manAudienceFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
  roundingMode: "floor",
});

export function formatAudienceCount(count?: number | null): string {
  if (typeof count !== "number" || !Number.isFinite(count)) {
    return "관객수 정보 없음";
  }

  if (count >= 10_000) {
    return `${manAudienceFormatter.format(count / 10_000)}만명`;
  }

  return `${count.toLocaleString("ko-KR")}명`;
}
