'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordReset } from '@/lib/auth-api';

const forgotPasswordSchema = z.object({
  email: z.email({
    error: '이메일 형식을 확인해 주세요.',
  }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleRequest: SubmitHandler<ForgotPasswordFormValues> = async (
    values,
  ) => {
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (error: unknown) {
      setError('root.server', {
        message:
          error instanceof Error
            ? error.message
            : '비밀번호 재설정 이메일 발송에 실패했습니다.',
      });
    }
  };

    if (sent) {
      return (
        <>
          <h1 className="auth-title">Password Reset</h1>
          <p className="auth-status">
            입력한 이메일로 비밀번호 재설정 안내를 보냈어요.
          </p>

          <nav className="auth-links" aria-label="인증 페이지 이동">
            <Link href="/login">로그인으로 돌아가기</Link>
            <Link href="/">CINEMO LOBBY</Link>
        </nav>
      </>
    );
  }

  return (
    <>
      <h1 className="auth-title">Password Reset</h1>
      <p className="auth-hint">
        가입한 이메일을 입력하면 재설정 링크를 보내요.
      </p>

      {errors.root?.server ? (
        <p className="auth-error" role="alert">
          {errors.root.server.message}
        </p>
      ) : null}

      <form
        className="auth-form"
        onSubmit={handleSubmit(handleRequest)}
        noValidate
      >
        <label className="auth-field">
          <span>이메일</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="cinemo@example.com"
            {...register('email')}
          />
          {errors.email ? (
            <span className="auth-hint auth-hint--danger">
              {errors.email.message}
            </span>
          ) : null}
        </label>

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '전송 중…' : '재설정 링크 받기'}
        </button>
      </form>

      <nav className="auth-links" aria-label="인증 페이지 이동">
        <Link href="/login">로그인으로 돌아가기</Link>
        <Link href="/">CINEMO LOBBY</Link>
      </nav>
    </>
  );
}
