export const CINEMO_COLORS = {
  background: "#0e1014",
  foreground: "#f3efe6",
  muted: "#958d82",
  gold: "#d4b56a",
  red: "#ad4f59",
  ink: "#17171a",
  borderSubtle: "rgba(243, 239, 230, 0.16)",
  borderMuted: "rgba(243, 239, 230, 0.24)",
  borderGold: "rgba(212, 181, 106, 0.45)",
} as const;

export type CinemoColor = (typeof CINEMO_COLORS)[keyof typeof CINEMO_COLORS];

export const CINEMO_RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export type CinemoRadius = (typeof CINEMO_RADIUS)[keyof typeof CINEMO_RADIUS];
