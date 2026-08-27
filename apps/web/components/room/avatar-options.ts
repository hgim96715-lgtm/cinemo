import type {
  AvatarConfig,
  EyebrowStyle,
  EyeStyle,
  GlassesStyle,
  HairStyle,
  HatStyle,
  MouthStyle,
  OutfitPreset,
} from '@cinemo/shared';

export const SKIN_COLORS = [
  '#f5f0e8',
  '#f0d4b0',
  '#d4975a',
  '#8b5e3c',
  '#4a2e1a',
];

export const HAT_COLORS = [
  '#b8914c',
  '#e85d5d',
  '#5d8fe8',
  '#6fbd6f',
  '#8f5ecb',
  '#2c2c2c',
];

export const BLUSH_COLORS: (string | null)[] = [
  '#f4a7b9',
  '#f4c4a7',
  '#a7d4f4',
  '#b4f4a7',
  null,
];

export const OUTFIT_COLORS = [
  '#c8a96e',
  '#5d8fe8',
  '#e85d5d',
  '#6fbd6f',
  '#8f5ecb',
  '#2c2c2c',
  '#e8d45d',
];

export const HAT_OPTIONS: { value: HatStyle; label: string }[] = [
  { value: 'cap', label: '캡' },
  { value: 'beanie', label: '비니' },
  { value: 'crown', label: '왕관' },
  { value: 'beret', label: '베레모' },
  { value: 'director', label: '감독 모자' },
  { value: 'popcorn', label: '팝콘 모자' },
  { value: 'none', label: '없음' },
];

export const EYE_OPTIONS: { value: EyeStyle; label: string }[] = [
  { value: 'normal', label: '동그란' },
  { value: 'crescent', label: '초승달' },
  { value: 'dot', label: '점' },
];

export const EYEBROW_OPTIONS: { value: EyebrowStyle; label: string }[] = [
  { value: 'natural', label: '자연스러운' },
  { value: 'raised', label: '올라간' },
  { value: 'soft', label: '부드러운' },
];

export const GLASSES_OPTIONS: { value: GlassesStyle; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'round', label: '둥근 안경' },
  { value: 'square', label: '네모 안경' },
];

export const HAIR_OPTIONS: { value: HairStyle; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'short', label: '짧은 머리' },
  { value: 'bob', label: '단발' },
];

export const MOUTH_OPTIONS: { value: MouthStyle; label: string }[] = [
  { value: 'smile', label: '미소' },
  { value: 'open', label: '활짝' },
  { value: 'neutral', label: '무표정' },
  { value: 'surprised', label: '놀람' },
  { value: 'pout', label: '삐짐' },
];

export const OUTFIT_OPTIONS: { value: OutfitPreset; label: string }[] = [
  { value: 'basic', label: '기본 관객복' },
  { value: 'staff', label: '영화관 직원복' },
  { value: 'velvet', label: '벨벳 재킷' },
  { value: 'tuxedo', label: '턱시도' },
  { value: 'hoodie', label: '후드티' },
  { value: 'knit', label: '니트' },
];

export function withOutfitPreset(
  outfit: AvatarConfig['outfit'],
  preset: OutfitPreset,
): AvatarConfig['outfit'] {
  switch (preset) {
    case 'basic':
      return {
        type: 'solid',
        preset,
        color: '#c8a96e',
      };
    case 'staff':
      return {
        type: 'stripe',
        preset,
        color1: '#2b2520',
        color2: '#d4b56a',
      };
    case 'velvet':
      return {
        type: 'solid',
        preset,
        color: '#6f3f5f',
      };
    case 'tuxedo':
      return {
        type: 'solid',
        preset,
        color: '#25232b',
      };
    case 'hoodie':
      return {
        type: 'solid',
        preset,
        color: '#4b6f9d',
      };
    case 'knit':
      return {
        type: 'dots',
        preset,
        color1: '#f5f0e8',
        color2: '#8f5ecb',
      };
    default:
      return { ...outfit, preset };
  }
}
