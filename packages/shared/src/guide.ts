/** 가입 직후 1회 · 로그인/재방문에는 안 뜸! 가이드 */

export const GUIDE_STORAGE_KEY = "cinemo_guide_done";

export const GUIDE_STEPS = [
  {
    id: "ticket",
    kicker: "TODAY'S TICKET",
    title: "오늘의 영화 티켓을 받아보세요",
    body: "매표소에서 티켓을 받고 뽑기방에서 오늘의 영화를 발견해요.",
  },
  {
    id: "upcoming",
    kicker: "SCREEN",
    title: "스크린에서 만날 영화를 저장해요",
    body: "개봉 예정작 중 마음에 드는 영화는 ‘보고 싶어요’로 저장해요.",
  },
  {
    id: "my-cinema",
    kicker: "MY CINEMA",
    title: "나만의 영화 기록을 만들어보세요",
    body: "본 영화는 관람 기록으로 남기고, 나만의 포스터를 걸어보세요.",
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
