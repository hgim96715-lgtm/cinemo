'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import {
  checkEmailRequest,
  checkNicknameRequest,
  registerRequest,
} from '@/lib/auth-api';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { useGuideStore } from '@/lib/guide-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return EMAIL_RE.test(value);
}

function isValidNickname(value: string) {
  return value.length >= 2 && value.length <= 20;
}

function passwordRules(password: string) {
  return {
    minLength: password.length >= 8,
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const emailStatus = useAvailabilityCheck({
    value: email,
    validate: isValidEmail,
    check: checkEmailRequest,
  });
  const [nickname, setNickname] = useState('');
  const nicknameStatus = useAvailabilityCheck({
    value: nickname,
    validate: isValidNickname,
    check: checkNicknameRequest,
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const requestGuide = useGuideStore((s) => s.requestGuide);

  const rules = passwordRules(password);

  async function register(formData: FormData) {
    setError(null);
    const passwordConfirm = formData.get('passwordConfirm');

    if (nicknameStatus === 'taken' || nicknameStatus === 'invalid') {
      setError('닉네임을 확인해 주세요');
      return;
    }
    if (typeof passwordConfirm !== 'string') {
      setError('입력을 확인해 주세요');
      return;
    }
    if (emailStatus !== 'ok' || nicknameStatus !== 'ok') {
      setError('이메일과 닉네임을 확인해 주세요');
      return;
    }
    if (!rules.minLength) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const data = await registerRequest(email, password, nickname);
      setSession(data.accessToken, data.user);
      requestGuide();
      router.push('/');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '회원가입에 실패했습니다.',
      );
    }
  }

  return (
    <>
      <h1 className="auth-title">Join</h1>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="auth-form" action={register}>
        <label className="auth-field">
          <span className="auth-label">
            이메일 <span className="auth-req">*</span>
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailStatus === 'checking' ? (
            <span className="auth-hint">확인 중…</span>
          ) : null}
          {emailStatus === 'taken' ? (
            <span className="auth-hint auth-hint--danger">
              이미 사용중인 이메일입니다.
            </span>
          ) : null}
          {emailStatus === 'ok' ? (
            <span className="auth-hint auth-hint--ok">
              사용 가능한 이메일입니다.
            </span>
          ) : null}
          {emailStatus === 'invalid' ? (
            <span className="auth-hint auth-hint--danger">
              이메일 형식을 확인해 주세요.
            </span>
          ) : null}
        </label>
        <label className="auth-field">
          <span className="auth-label">
            닉네임 <span className="auth-req">*</span>
          </span>
          <input
            name="nickname"
            type="text"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          {nicknameStatus === 'checking' ? (
            <span className="auth-hint">확인 중…</span>
          ) : null}
          {nicknameStatus === 'taken' ? (
            <span className="auth-hint auth-hint--danger">
              이미 사용중인 닉네임입니다.
            </span>
          ) : null}
          {nicknameStatus === 'ok' ? (
            <span className="auth-hint auth-hint--ok">
              사용 가능한 닉네임입니다.
            </span>
          ) : null}
          {nicknameStatus === 'invalid' ? (
            <span className="auth-hint auth-hint--danger">
              닉네임은 2~20자여야 합니다.
            </span>
          ) : null}
        </label>
        <div className="auth-field">
          <span className="auth-label">
            비밀번호 <span className="auth-req">*</span>
            <span
              className={`auth-rule-inline${rules.minLength ? ' is-ok' : ''}`}
            >
              8자 이상
            </span>
          </span>
          <div className="auth-password-row">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <div className="auth-field">
          <span className="auth-label">
            비밀번호 확인 <span className="auth-req">*</span>
          </span>
          <div className="auth-password-row">
            <input
              name="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
            />
            <button
              type="button"
              className="auth-eye"
              aria-label={
                showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'
              }
              onClick={() => setShowPasswordConfirm((v) => !v)}
            >
              {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button className="auth-submit" type="submit">
          티켓 발급받기
        </button>
      </form>
      <p className="auth-links">
        <Link href="/login">로그인</Link>
        {' · '}
        <Link href="/">홈으로</Link>
      </p>
    </>
  );
}
