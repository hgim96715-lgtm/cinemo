'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { loginRequest } from '@/lib/auth-api';

const loginSchema = z.object({
  email: z.email({
    error: '이메일 형식을 확인해 주세요.',
  }),
  password: z.string().min(8, {
    error: '비밀번호는 8자 이상이어야 합니다.',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [recentLoginProvider, setRecentLoginProvider] = useState<string | null>(
    null,
  );
  const isRecentProvider = (provider: string) =>
    recentLoginProvider === provider;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      const data = await loginRequest(values.email, values.password);
      setSession(data.accessToken, data.user);
      localStorage.setItem(
        'cinemo_recent_login_provider',
        data.user.lastLoginProvider ?? 'email',
      );
      const destination =
        data.user.role === 'admin'
          ? '/admin'
          : next && next.startsWith('/') && !next.startsWith('//')
            ? next
            : '/';
      router.push(destination);
    } catch (error: unknown) {
      setError('root.server', {
        message:
          error instanceof Error ? error.message : '로그인에 실패했습니다.',
      });
    }
  };

  useEffect(() => {
    setRecentLoginProvider(
      localStorage.getItem('cinemo_recent_login_provider'),
    );
  }, []);

  return (
    <>
      <h1 className="auth-title">Login</h1>

      {errors.root?.server ? (
        <p className="auth-error" role="alert">
          {errors.root.server.message}
        </p>
      ) : null}

      <form
        className="auth-form"
        onSubmit={handleSubmit(handleLogin)}
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

        <div className="auth-field">
          <span>비밀번호</span>

          <div className="auth-password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="off"
              placeholder="비밀번호를 입력하세요"
              {...register('password')}
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

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '입장 중…' : '입장하기'}
        </button>
      </form>

      <div className="auth-divider">또는</div>

      <div
        className={`auth-social${recentLoginProvider ? ' auth-social--has-recent' : ''}`}
      >
        <div className="auth-social-item">
          <button
            type="button"
            className={`auth-social-btn auth-social-btn--icon${isRecentProvider('google') ? ' auth-social-btn--recent' : ''}`}
            aria-label={
              isRecentProvider('google')
                ? 'Google로 로그인, 최근 로그인 방식'
                : 'Google로 로그인'
            }
            onClick={() => {
              const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3050';

              window.location.href = `${apiUrl}/v1/auth/google`;
            }}
          >
            <Image src="/brand/google.svg" alt="" width={20} height={20} />
          </button>
          {isRecentProvider('google') ? (
            <span className="auth-social-recent">최근 사용</span>
          ) : null}
        </div>
        <div className="auth-social-item">
          <button
            type="button"
            className={`auth-social-btn auth-social-btn--icon auth-social-btn--naver${isRecentProvider('naver') ? ' auth-social-btn--recent' : ''}`}
            aria-label={
              isRecentProvider('naver')
                ? '네이버로 로그인, 최근 로그인 방식'
                : '네이버로 로그인'
            }
            onClick={() => {
              const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3050';

              window.location.href = `${apiUrl}/v1/auth/naver`;
            }}
          >
            <Image src="/brand/naver.svg" alt="" width={20} height={20} />
          </button>
          {isRecentProvider('naver') ? (
            <span className="auth-social-recent">최근 사용</span>
          ) : null}
        </div>
        <div className="auth-social-item">
          <button
            type="button"
            className={`auth-social-btn auth-social-btn--icon auth-social-btn--apple${isRecentProvider('apple') ? ' auth-social-btn--recent' : ''}`}
            aria-label={
              isRecentProvider('apple')
                ? 'Apple로 로그인, 최근 로그인 방식'
                : 'Apple로 로그인'
            }
            disabled
          >
            <Image src="/brand/apple.svg" alt="" width={20} height={20} />
          </button>
        </div>
        <div className="auth-social-item">
          <button
            type="button"
            className={`auth-social-btn auth-social-btn--icon auth-social-btn--kakao${isRecentProvider('kakao') ? ' auth-social-btn--recent' : ''}`}
            aria-label={
              isRecentProvider('kakao')
                ? '카카오톡으로 로그인, 최근 로그인 방식'
                : '카카오톡으로 로그인'
            }
            onClick={() => {
              const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3050';

              window.location.href = `${apiUrl}/v1/auth/kakao`;
            }}
            disabled
          >
            <Image src="/brand/kakao.svg" alt="" width={22} height={22} />
          </button>
        </div>
      </div>

      <nav className="auth-links" aria-label="인증 페이지 이동">
        <Link href="/forgot-password">비밀번호 찾기</Link>
        <Link href="/register">회원가입</Link>
        <Link href="/">CINEMO LOBBY</Link>
      </nav>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="auth-status">불러오는 중…</p>}>
      <LoginForm />
    </Suspense>
  );
}
