import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="auth-title">Password Reset</h1>

      <p className="auth-hint">비밀번호 재설정 기능을 준비 중이에요.</p>

      <p className="auth-links">
        <Link href="/login">로그인으로 돌아가기</Link>
        {' · '}
        <Link href="/">CINEMO LOBBY</Link>
      </p>
    </>
  );
}
