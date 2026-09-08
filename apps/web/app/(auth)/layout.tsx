import Link from 'next/link';
import '../styles/auth.css';
import '../styles/login.css';
import '../styles/register.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <header className="auth-header">
          <Link href="/" className="auth-brand">
            CINEMO
          </Link>
          <p className="auth-tagline">불 꺼진 매표소</p>
        </header>
        {children}
      </div>
    </div>
  );
}
