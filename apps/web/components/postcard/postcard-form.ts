import { z } from 'zod';

export const postcardSchema = z.object({
  tmdbId: z
    .number()
    .int()
    .positive()
    .nullable()
    .refine(
      (value): boolean => value !== null,
      '영화를 선택해 주세요.',
    ),
  originalText: z
    .string()
    .trim()
    .max(1000, '원문은 1000자까지 입력할 수 있습니다.'),
  text: z
    .string()
    .trim()
    .min(1, '엽서 내용을 입력해 주세요.')
    .max(1000, '엽서 내용은 1000자까지 입력할 수 있습니다.'),
  isPublic: z.boolean(),
});

export type PostcardFormValues = z.infer<typeof postcardSchema>;
