/** 가입 직후 1회 · 로그인/재방문에는 안 뜸! 가이드 */

export const GUIDE_STORAGE_KEY = "cinemo_guide_done";

export const GUIDE_STEPS = [
  {
    id: "ticket",
    kicker: "TICKET",
    title: "매표소에서 오늘 티켓",
    body: "하루에 한 장. 뽑기방에 들어갈 때 씁니다.",
  },
  {
    id: "gacha",
    kicker: "GACHA",
    title: "뽑기방에서 한 편",
    body: "장르·국적·추천 머신으로 오늘의 영화를 뽑아요.",
  },
  {
    id: "review",
    kicker: "REVIEW",
    title: "후기방에 남기기",
    body: "본 영화에 짧은 후기와 별점을 올리면 볼이 가득 쌓여요. 일주일 마다 후기가 많은 영화가 주간 베스트 영화로 선정돼요.",
  },
  {
    id: "cafe",
    kicker: "CAFE",
    title: "카페에서 수다",
    body: "테이블에 앉아 다른 손님과 이야기할 수 있어요. 단, 채팅방들은 하루 이후에는 초기화 돼요.",
  },
] as const;

export type GuideStepId = (typeof GUIDE_STEPS)[number]["id"];
export type GuideStep = (typeof GUIDE_STEPS)[number];

export type LobbyGuideStep = {
  id: string;
  kicker: string;
  title: string;
  body: string;
};

export const DEFAULT_LOBBY_GUIDE_STEPS: LobbyGuideStep[] = GUIDE_STEPS.map(
  (step) => ({
    id: step.id,
    kicker: step.kicker,
    title: step.title,
    body: step.body,
  }),
);

export const DEFAULT_LOBBY_GUIDE_RULES = DEFAULT_LOBBY_GUIDE_STEPS.map(
  (step) => step.body,
);

export type LobbyGuide = {
  id: string;
  key: string;
  steps: LobbyGuideStep[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateLobbyGuideInput = {
  steps: LobbyGuideStep[];
};
