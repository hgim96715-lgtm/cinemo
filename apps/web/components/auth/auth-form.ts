import { z } from 'zod';

const emailSchema = z.email({
  error: '이메일 형식을 확인해 주세요.',
});

const passwordSchema = z.string().min(8, {
  error: '비밀번호는 8자 이상이어야 합니다.',
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    email: emailSchema,
    nickname: z
      .string()
      .min(2, {
        error: '닉네임은 2자 이상이어야 합니다.',
      })
      .max(20, {
        error: '닉네임은 20자 이하이어야 합니다.',
      }),
    password: passwordSchema,
    passwordConfirm: z.string().min(8, {
      error: '비밀번호를 다시 입력해 주세요.',
    }),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    error: '비밀번호가 일치하지 않습니다.',
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(8, {
      error: '비밀번호를 다시 입력해 주세요.',
    }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    error: '비밀번호가 일치하지 않습니다.',
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
