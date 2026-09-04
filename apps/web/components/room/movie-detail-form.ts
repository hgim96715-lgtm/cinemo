import type {
  UserMovieViewingDetails,
  UserMovieViewingType,
} from '@cinemo/shared';
import { z } from 'zod';
import { kstDateKey } from '@/lib/date-kst';

export const movieScreeningSchema = z.object({
  watchedAt: z
    .string()
    .min(1, '관람일을 선택하세요.')
    .refine((date) => date <= kstDateKey(), {
      message: '관람일은 오늘 또는 이전 날짜만 선택할 수 있어요.',
    }),
  viewingType: z.union([z.literal(''), z.enum(['theater', 'home', 'other'])]),
  viewingTypeCustom: z
    .string()
    .trim()
    .max(100, '관람 방식은 100자까지 입력할 수 있어요.'),
  viewingPlatformMode: z.enum(['preset', 'custom']),
  viewingPlatform: z
    .string()
    .trim()
    .max(40, '플랫폼은 40자까지 입력할 수 있어요.'),
  customViewingPlatform: z
    .string()
    .trim()
    .max(40, '플랫폼은 40자까지 입력할 수 있어요.'),
  viewingLocation: z
    .string()
    .trim()
    .max(100, '관람 장소는 100자까지 입력할 수 있어요.'),
  review: z.string().trim().max(1000, '후기는 1000자까지 입력할 수 있어요.'),
  rating: z.number().int().min(1).max(10).nullable(),
});

export type MovieScreeningFormValues = z.infer<typeof movieScreeningSchema>;

export const VIEWING_PLATFORM_OPTIONS = [
  'Netflix',
  'Disney+',
  '왓챠',
  '쿠팡플레이',
  'Amazon Prime Video',
] as const;

export const VIEWING_TYPE_OPTIONS = [
  { value: '', label: '선택 안 함' },
  { value: 'theater', label: '영화관' },
  { value: 'home', label: '집' },
  { value: 'other', label: '기타' },
] as const;

export type SavedScreeningDetails = UserMovieViewingDetails & {
  watchedAt: string | null;
};

export function isCustomViewingPlatform(value: string | null | undefined) {
  return Boolean(
    value &&
      !VIEWING_PLATFORM_OPTIONS.includes(
        value as (typeof VIEWING_PLATFORM_OPTIONS)[number],
      ),
  );
}

export function getViewingTypeValue(
  value: UserMovieViewingType | null | undefined,
): MovieScreeningFormValues['viewingType'] {
  return value ?? '';
}
