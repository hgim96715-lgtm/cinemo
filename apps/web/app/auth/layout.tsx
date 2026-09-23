import Link from 'next/link';
import '@/styles/common.css';
import '@/styles/auth.css';

export default function OAuthLayout({
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
        </header>
        {children}
      </div>
    </div>
  );
}
