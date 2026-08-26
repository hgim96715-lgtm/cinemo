'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { loginRequest } from '@/lib/auth-api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function login(formData: FormData) {
    setError(null);
    const email = formData.get('email');
    const password = formData.get('password');
    if (typeof email !== 'string' || typeof password !== 'string') {
      setError('입력을 확인해 주세요');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    try {
      const data = await loginRequest(email, password);
      setSession(data.accessToken, data.user);
      const dest =
        data.user.role === 'admin'
          ? '/admin'
          : next && next.startsWith('/') && !next.startsWith('//')
            ? next
            : '/';
      router.push(dest);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '로그인에 실패했습니다.',
      );
    }
  }

  return (
    <>
      <h1 className="auth-title">Login</h1>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="auth-form" action={login}>
        <label className="auth-field">
          이메일
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <div className="auth-field">
          <span>비밀번호</span>
          <div className="auth-password-row">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-eye"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button className="auth-submit" type="submit">
          입장하기
        </button>
      </form>
      <div className="auth-divider">또는</div>
      <div className="auth-social">
        <button type="button" className="auth-social-btn" disabled>
          Google
        </button>
        <button type="button" className="auth-social-btn" disabled>
          Naver
        </button>
        <button type="button" className="auth-social-btn" disabled>
          Apple
        </button>
      </div>
      <p className="auth-links">
        <Link href="/register">회원가입</Link>
        {' · '}
        <Link href="/">홈으로</Link>
      </p>
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
