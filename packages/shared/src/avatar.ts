export type HatStyle =
  | "cap"
  | "beanie"
  | "crown"
  | "beret"
  | "director"
  | "popcorn"
  | "none";

export type EyeStyle = "normal" | "crescent" | "dot";

export type EyebrowStyle = "natural" | "raised" | "soft";

export type GlassesStyle = "none" | "round" | "square";

export type HairStyle = "none" | "short" | "bob";

export type MouthStyle =
  | "smile"
  | "open"
  | "neutral"
  | "surprised"
  | "pout";

export type OutfitPreset =
  | "basic"
  | "staff"
  | "velvet"
  | "tuxedo"
  | "hoodie"
  | "knit";

type OutfitBase = {
  preset?: OutfitPreset;
};

export type OutfitStyle =
  | (OutfitBase & { type: "solid"; color: string })
  | (OutfitBase & { type: "stripe"; color1: string; color2: string })
  | (OutfitBase & { type: "dots"; color1: string; color2: string });

export type AvatarConfig = {
  hat: HatStyle;
  hatColor: string;
  skinColor: string;
  eyeStyle: EyeStyle;
  eyebrowStyle?: EyebrowStyle;
  glassesStyle?: GlassesStyle;
  hairStyle?: HairStyle;
  blushColor: string | null;
  mouthStyle: MouthStyle;
  outfit: OutfitStyle;
};

export const DEFAULT_AVATAR: AvatarConfig = {
  hat: "cap",
  hatColor: "#b8914c",
  skinColor: "#f5f0e8",
  eyeStyle: "normal",
  eyebrowStyle: "natural",
  glassesStyle: "none",
  hairStyle: "none",
  blushColor: "#f4a7b9",
  mouthStyle: "smile",
  outfit: { type: "solid", preset: "basic", color: "#c8a96e" },
};

export const ADMIN_AVATAR: AvatarConfig = {
  hat: "crown",
  hatColor: "#d4b56a",
  skinColor: "#f5f0e8",
  eyeStyle: "crescent",
  eyebrowStyle: "raised",
  glassesStyle: "none",
  hairStyle: "none",
  blushColor: null,
  mouthStyle: "smile",
  outfit: {
    type: "stripe",
    preset: "staff",
    color1: "#2b2520",
    color2: "#d4b56a",
  },
};
