'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeOAuthCodeRequest } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';

function SocialCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const exchangePromiseRef = useRef<ReturnType<
    typeof exchangeOAuthCodeRequest
  > | null>(null);
  const exchangeCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      router.replace('/login');
      return;
    }
    const oauthCode: string = code;

    // React Strict Mode에서 effect가 다시 실행되어도 같은 요청을 공유함
    if (exchangeCodeRef.current !== oauthCode) {
      exchangeCodeRef.current = oauthCode;
      exchangePromiseRef.current = exchangeOAuthCodeRequest(oauthCode);
    }

    let active = true;

    const exchangePromise = exchangePromiseRef.current;

    if (!exchangePromise) return;

    async function completeLogin() {
      try {
        const auth = await exchangePromise;

        if (!auth) {
          throw new Error('소셜 로그인 응답이 비어 있어요.');
        }

        if (!active) return;

        setSession(auth.accessToken, auth.user);
        if (auth.user.lastLoginProvider) {
          localStorage.setItem(
            'cinemo_recent_login_provider',
            auth.user.lastLoginProvider,
          );
        } else {
          localStorage.removeItem('cinemo_recent_login_provider');
        }

        router.replace(auth.user.role === 'admin' ? '/admin' : '/');
      } catch (error: unknown) {
        if (!active) return;

        setError(
          error instanceof Error
            ? error.message
            : '소셜 로그인 처리에 실패했어요.',
        );
      }
    }

    void completeLogin();
    return () => {
      active = false;
    };
  }, [router, searchParams, setSession]);

  return error ? (
    <p className="auth-status auth-hint--danger" role="alert">
      {error}
    </p>
  ) : (
    <p className="auth-status">로그인 처리 중…</p>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<p className="auth-status">로그인 처리 중…</p>}>
      <SocialCallback />
    </Suspense>
  );
}
