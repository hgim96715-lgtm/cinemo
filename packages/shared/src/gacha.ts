export const GACHA_ROOMS = [
  { id: "genre", label: "장르방" },
  { id: "country", label: "국적방" },
  { id: "picks", label: "추천방" },
] as const;

/** 방마다 8대 (랜덤 포함 / 국적 8) — 6~9 실험 구간 */
export const GACHA_MACHINES = [
  { id: "random", room: "genre", label: "랜덤", kicker: "RANDOM" },
  { id: "thriller", room: "genre", label: "스릴러", kicker: "THRILLER" },
  { id: "action", room: "genre", label: "액션", kicker: "ACTION" },
  { id: "comedy", room: "genre", label: "코미디", kicker: "COMEDY" },
  { id: "romance", room: "genre", label: "로맨스", kicker: "ROMANCE" },
  { id: "horror", room: "genre", label: "공포", kicker: "HORROR" },
  { id: "sf", room: "genre", label: "SF", kicker: "SF" },
  { id: "drama", room: "genre", label: "드라마", kicker: "DRAMA" },
  { id: "kr", room: "country", label: "한국", kicker: "KR" },
  { id: "jp", room: "country", label: "일본", kicker: "JP" },
  { id: "us", room: "country", label: "미국", kicker: "US" },
  { id: "fr", room: "country", label: "프랑스", kicker: "FR" },
  { id: "gb", room: "country", label: "영국", kicker: "GB" },
  { id: "cn", room: "country", label: "중국", kicker: "CN" },
  { id: "de", room: "country", label: "독일", kicker: "DE" },
  { id: "in", room: "country", label: "인도", kicker: "IN" },
  { id: "picks", room: "picks", label: "추천픽", kicker: "PICKS" },
] as const;

export type GachaMachineId = (typeof GACHA_MACHINES)[number]["id"];
export type GachaRoomId = (typeof GACHA_MACHINES)[number]["room"];

export const GACHA_TMDB_FILTERS: Record<
  GachaMachineId,
  Record<string, string>
> = {
  random: {},
  thriller: { with_genres: "53" },
  action: { with_genres: "28" },
  comedy: { with_genres: "35" },
  romance: { with_genres: "10749" },
  horror: { with_genres: "27" },
  sf: { with_genres: "878" },
  drama: { with_genres: "18" },
  kr: { with_origin_country: "KR" },
  jp: { with_origin_country: "JP" },
  us: { with_origin_country: "US" },
  fr: { with_origin_country: "FR" },
  gb: { with_origin_country: "GB" },
  cn: { with_origin_country: "CN" },
  de: { with_origin_country: "DE" },
  in: { with_origin_country: "IN" },
  picks: {},
};

export function isGachaMachineId(id: string): id is GachaMachineId {
  return GACHA_MACHINES.some((m) => m.id === id);
}
export type WatchProvider = {
  id: number;
  name: string;
  logo_path: string;
};

export type GachaMovie = {
  id: number;
  title: string;
  original_title?: string;
  original_language?: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  director: string | null;
  cast?: string[];
  providers: WatchProvider[];
  trailerUrl?: string | null;
};

export type UseTicketResult = {
  status: "used";
  machineId: string;
  movie: GachaMovie;
};

export type TodayTicket = {
  status: "none" | "issued" | "used";
  machineId: string | null;
  tmdbId: number | null;
  movie: GachaMovie | null;
};

export type MovieWithTags = GachaMovie & {
  genre_ids: number[];
  origin_countries: string[];
};
