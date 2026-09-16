/** 로비 방 ID — api/web 공통 */
export const LOBBY_ROOMS = {
  BOX_OFFICE: "box-office",
} as const;

export type LobbyRoomId = (typeof LOBBY_ROOMS)[keyof typeof LOBBY_ROOMS];

export * from "./movie";
export * from "./user-movie";
export * from "./lobby-board";
export * from "./admin";
export * from "./avatar";
export * from "./profile";
export * from "./guide";
export * from "./postcard";
