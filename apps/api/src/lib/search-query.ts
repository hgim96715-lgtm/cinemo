/** 검색어 앞뒤·연속 공백 · 전각 문자 정리 */
export function normalizeSearchQuery(query: string): string {
  return query.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

/**
 * TMDB: 붙여 쓴 한글 제목의 가능한 분리 위치를 순서대로 시도
 * 예: 비긴어 → 비 긴어 → 비긴 어
 */
export function searchQueryFallbacks(query: string): string[] {
  if (/\s/.test(query) || query.length < 3) return [];

  const characters = Array.from(query);
  const out: string[] = [];
  const splitIndexes = new Set<number>();

  // 제목이 길어도 TMDB 요청을 과도하게 반복하지 않도록 앞·뒤 후보만 시도
  for (let index = 1; index < Math.min(characters.length, 5); index += 1) {
    splitIndexes.add(index);
  }
  for (
    let index = Math.max(1, characters.length - 4);
    index < characters.length;
    index += 1
  ) {
    splitIndexes.add(index);
  }

  for (const index of splitIndexes) {
    out.push(
      `${characters.slice(0, index).join('')} ${characters
        .slice(index)
        .join('')}`,
    );
  }

  return out;
}
