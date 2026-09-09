'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordRequest } from '@/lib/auth-api';
import { Eye, EyeOff } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, {
      error: '비밀번호는 8자 이상이어야 합니다.',
    }),
    confirmPassword: z.string().min(8, {
      error: '비밀번호를 다시 입력해 주세요.',
    }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    error: '비밀번호가 일치하지 않습니다.',
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [completed, setCompleted] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleResetPassword: SubmitHandler<ResetPasswordFormValues> = async (
    values,
  ) => {
    if (!token) {
      setError('root.server', {
        message: '비밀번호 재설정 링크가 올바르지 않습니다.',
      });
      return;
    }
    try {
      await resetPasswordRequest(token, values.newPassword);
      setCompleted(true);
    } catch (error: unknown) {
      setError('root.server', {
        message:
          error instanceof Error
            ? error.message
            : '비밀번호 변경에 실패했습니다.',
      });
    }
  };
  if (completed) {
    return (
      <>
        <h1 className="auth-title">Password Reset</h1>
        <p className="auth-status">비밀번호가 변경되었어요.</p>
        <button
          type="button"
          className="auth-submit"
          onClick={() => router.replace('/login')}
        >
          로그인하러 가기
        </button>
      </>
    );
  }
  return (
    <>
      <h1 className="auth-title">Reset Password</h1>
      <p className="auth-hint">새로운 비밀번호를 입력해 주세요.</p>

      {errors.root?.server ? (
        <p className="auth-error" role="alert">
          {errors.root.server.message}
        </p>
      ) : null}

      <form
        className="auth-form"
        onSubmit={handleSubmit(handleResetPassword)}
        noValidate
      >
        <label className="auth-field">
          <span>새 비밀번호</span>

          <div className="auth-password-row">
            <input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8자 이상 입력하세요"
              {...register('newPassword')}
            />

            <button
              type="button"
              className="auth-eye"
              aria-label={
                showNewPassword ? '새 비밀번호 숨기기' : '새 비밀번호 보기'
              }
              onClick={() => setShowNewPassword((visible) => !visible)}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.newPassword ? (
            <span className="auth-hint auth-hint--danger">
              {errors.newPassword.message}
            </span>
          ) : null}
        </label>

        <label className="auth-field">
          <span>새 비밀번호 확인</span>

          <div className="auth-password-row">
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력하세요"
              {...register('confirmPassword')}
            />

            <button
              type="button"
              className="auth-eye"
              aria-label={
                showConfirmPassword
                  ? '비밀번호 확인 숨기기'
                  : '비밀번호 확인 보기'
              }
              onClick={() => setShowConfirmPassword((visible) => !visible)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.confirmPassword ? (
            <span className="auth-hint auth-hint--danger">
              {errors.confirmPassword.message}
            </span>
          ) : null}
        </label>

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>

      <nav className="auth-links" aria-label="인증 페이지 이동">
        <Link href="/login">로그인으로 돌아가기</Link>
        <Link href="/">CINEMO LOBBY</Link>
      </nav>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="auth-status">불러오는 중…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
