export const PROFILE_BIO_MAX = 200;
export const PROFILE_TAG_LIMIT = 12;
export const PROFILE_TAG_MAX_LEN = 20;

/** 모달 「추천 태그」 — 누르면 tags에 추가 (#는 UI에서 붙임) */
export const PROFILE_SUGGESTED_TAGS = [
  "10대",
  "20대",
  "30대",
  "스릴러",
  "액션",
  "로맨스",
  "코미디",
  "SF",
  "공포",
  "드라마",
  "한국영화",
  "일본영화",
  "넷플릭스",
  "디즈니+",
  "티빙",
  "웨이브",
  "왓챠",
  "쿠팡플레이",
] as const;

export type ProfileConfig = {
  bio: string | null;
  profilePublic: boolean;
  tags: string[];
};
export type OwnerProfile = ProfileConfig & { nickname: string };
type PublicProfileOpen = {
  nickname: string;
  profilePublic: true;
  avatarConfig: unknown;
  bio: string | null;
  tags: string[];
};
type PublicProfileClosed = {
  nickname: string;
  profilePublic: false;
};
export type PublicProfile = PublicProfileOpen | PublicProfileClosed;
export const DEFAULT_PROFILE: ProfileConfig = {
  bio: null,
  profilePublic: false,
  tags: [],
};

/** `#스릴러` · `스릴러` → 저장용 `스릴러` · 빈값·초과면 null */
export function normalizeProfileTag(raw: string): string | null {
  const text = raw.trim().replace(/^#+/, "");
  if (!text || text.length > PROFILE_TAG_MAX_LEN) return null;
  return text;
}

export function normalizeProfileTags(list: string[]): string[] {
  const out: string[] = [];
  for (const raw of list) {
    const tag = normalizeProfileTag(raw);
    if (!tag || out.includes(tag)) continue;
    out.push(tag);
    if (out.length >= PROFILE_TAG_LIMIT) break;
  }
  return out;
}
