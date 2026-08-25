export type HatStyle = "cap" | "beanie" | "crown" | "none";
export type EyeStyle = "normal" | "crescent" | "dot";
export type MouthStyle = "smile" | "open" | "cat";
export type OutfitStyle =
  | { type: "solid"; color: string }
  | { type: "stripe"; color1: string; color2: string }
  | { type: "dots"; color1: string; color2: string };

export type AvatarConfig = {
  hat: HatStyle;
  hatColor: string;
  skinColor: string;
  eyeStyle: EyeStyle;
  blushColor: string | null;
  mouthStyle: MouthStyle;
  outfit: OutfitStyle;
};

export const DEFAULT_AVATAR: AvatarConfig = {
  hat: "cap",
  hatColor: "#b8914c",
  skinColor: "#f5f0e8",
  eyeStyle: "normal",
  blushColor: "#f4a7b9",
  mouthStyle: "smile",
  outfit: { type: "solid", color: "#c8a96e" },
};

export const ADMIN_AVATAR: AvatarConfig = {
  hat: "crown",
  hatColor: "#d4b56a",
  skinColor: "#f5f0e8",
  eyeStyle: "crescent",
  blushColor: null,
  mouthStyle: "smile",
  outfit: {
    type: "stripe",
    color1: "#2b2520",
    color2: "#d4b56a",
  },
};
