/** 로비 방 ID — api/web 공통 */
export const LOBBY_ROOMS = {
  BOX_OFFICE: "box-office",
  GACHA: "gacha",
  REVIEW: "review",
  CAFETERIA: "cafeteria",
} as const;

export type LobbyRoomId = (typeof LOBBY_ROOMS)[keyof typeof LOBBY_ROOMS];

/** 티켓 = 오늘 뽑기 1회권 */
export type TicketStatus = "none" | "issued" | "used";

export * from "./gacha";
export * from "./user-movie";
export * from "./review-post";
export * from "./lobby-board";
export * from "./cafe";
export * from "./admin";
export * from "./avatar";
export * from "./profile";
export * from "./guide";
