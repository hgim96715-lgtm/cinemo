'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { registerRequest } from '@/lib/auth-api';
import {
  useEmailAvailability,
  useNicknameAvailability,
} from './useAvailabilityQuery';
import type { AvailabilityStatus } from './useAvailabilityQuery';

const registerSchema = z
  .object({
    email: z.email({
      error: '이메일 형식을 확인해 주세요.',
    }),
    nickname: z
      .string()
      .min(2, {
        error: '닉네임은 2자 이상이어야 합니다.',
      })
      .max(20, {
        error: '닉네임은 20자 이하이어야 합니다.',
      }),
    password: z.string().min(8, {
      error: '비밀번호는 8자 이상이어야 합니다.',
    }),
    passwordConfirm: z.string().min(8, {
      error: '비밀번호를 다시 입력해 주세요.',
    }),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    error: '비밀번호가 일치하지 않습니다.',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function AvailabilityMessage({
  status,
}: {
  status: AvailabilityStatus;
}): ReactNode {
  switch (status) {
    case 'checking':
      return <span className="auth-hint">확인 중…</span>;

    case 'available':
      return (
        <span className="auth-hint auth-hint--ok">사용 가능한 값입니다.</span>
      );

    case 'unavailable':
      return (
        <span className="auth-hint auth-hint--danger">이미 사용 중입니다.</span>
      );

    case 'validationError':
      return (
        <span className="auth-hint auth-hint--danger">
          입력 형식을 확인해 주세요.
        </span>
      );

    case 'error':
      return (
        <span className="auth-hint auth-hint--danger">
          중복 확인에 실패했습니다.
        </span>
      );

    default:
      return null;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register: registerField,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      nickname: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const email = useWatch({
    control,
    name: 'email',
    defaultValue: '',
  });

  const nickname = useWatch({
    control,
    name: 'nickname',
    defaultValue: '',
  });

  const password = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });

  const emailAvailability = useEmailAvailability(email);
  const nicknameAvailability = useNicknameAvailability(nickname);

  const handleRegister: SubmitHandler<RegisterFormValues> = async (values) => {
    if (emailAvailability.status !== 'available') {
      setError('root.server', {
        message: '이메일 중복 확인을 완료해 주세요.',
      });
      return;
    }

    if (nicknameAvailability.status !== 'available') {
      setError('root.server', {
        message: '닉네임 중복 확인을 완료해 주세요.',
      });
      return;
    }

    try {
      const data = await registerRequest(
        values.email,
        values.password,
        values.nickname,
      );

      setSession(data.accessToken, data.user);
      router.push('/');
    } catch (error: unknown) {
      setError('root.server', {
        message:
          error instanceof Error ? error.message : '회원가입에 실패했습니다.',
      });
    }
  };

  return (
    <>
      <h1 className="auth-title">Join</h1>

      {errors.root?.server ? (
        <p className="auth-error" role="alert">
          {errors.root.server.message}
        </p>
      ) : null}

      <form
        className="auth-form"
        onSubmit={handleSubmit(handleRegister)}
        noValidate
      >
        <label className="auth-field">
          <span className="auth-label">
            이메일 <span className="auth-req">*</span>
          </span>

          <input
            type="email"
            autoComplete="email"
            placeholder="cinemo@example.com"
            {...registerField('email')}
          />

          {errors.email ? (
            <span className="auth-hint auth-hint--danger">
              {errors.email.message}
            </span>
          ) : (
            <AvailabilityMessage status={emailAvailability.status} />
          )}
        </label>

        <label className="auth-field">
          <span className="auth-label">
            닉네임 <span className="auth-req">*</span>
          </span>

          <input
            type="text"
            autoComplete="nickname"
            placeholder="닉네임을 입력하세요"
            {...registerField('nickname')}
          />

          {errors.nickname ? (
            <span className="auth-hint auth-hint--danger">
              {errors.nickname.message}
            </span>
          ) : (
            <AvailabilityMessage status={nicknameAvailability.status} />
          )}
        </label>

        <div className="auth-field">
          <span className="auth-label">
            비밀번호 <span className="auth-req">*</span>
            <span
              className={`auth-rule-inline${
                password.length >= 8 ? ' is-ok' : ''
              }`}
            >
              8자 이상
            </span>
          </span>

          <div className="auth-password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8자 이상 입력하세요"
              {...registerField('password')}
            />

            <button
              type="button"
              className="auth-eye"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.password ? (
            <span className="auth-hint auth-hint--danger">
              {errors.password.message}
            </span>
          ) : null}
        </div>

        <div className="auth-field">
          <span className="auth-label">
            비밀번호 확인 <span className="auth-req">*</span>
          </span>

          <div className="auth-password-row">
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력하세요"
              {...registerField('passwordConfirm')}
            />

            <button
              type="button"
              className="auth-eye"
              aria-label={
                showPasswordConfirm
                  ? '비밀번호 확인 숨기기'
                  : '비밀번호 확인 보기'
              }
              onClick={() => setShowPasswordConfirm((visible) => !visible)}
            >
              {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.passwordConfirm ? (
            <span className="auth-hint auth-hint--danger">
              {errors.passwordConfirm.message}
            </span>
          ) : null}
        </div>

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '가입 중…' : '회원가입하기'}
        </button>
      </form>

      <nav className="auth-links" aria-label="인증 페이지 이동">
        <Link href="/login">로그인</Link>
        <Link href="/">CINEMO LOBBY</Link>
      </nav>
    </>
  );
}
