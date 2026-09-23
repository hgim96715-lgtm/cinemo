export const PROFILE_BIO_MAX = 200;
export const PROFILE_TAG_LIMIT = 12;
export const PROFILE_TAG_MAX_LEN = 20;

export const PROFILE_SUGGESTED_TAGS = [
  "CGV",
  "메가박스",
  "롯데시네마",
  "스릴러",
  "액션",
  "로맨스",
  "코미디",
  "SF",
  "공포",
  "드라마",
  "애니메이션",
  "다큐멘터리",
  "독립영화",
  "예술영화",
  "반전 영화",
  "한국영화",
  "외국영화",
] as const;

export type ProfileConfig = {
  bio: string | null;
  profilePublic: boolean;
  tags: string[];
};

export const DEFAULT_PROFILE: ProfileConfig = {
  bio: null,
  profilePublic: false,
  tags: [],
};

export function normalizeProfileTag(raw: string): string | null {
  const text = raw.trim().replace(/^#+/, "");
  if (!text || text.length > PROFILE_TAG_MAX_LEN) return null;
  return text;
}

export function normalizeProfileTags(list: string[]): string[] {
  const result: string[] = [];

  for (const raw of list) {
    const tag = normalizeProfileTag(raw);
    if (!tag || result.includes(tag)) continue;

    result.push(tag);

    if (result.length >= PROFILE_TAG_LIMIT) break;
  }

  return result;
}
