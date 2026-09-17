'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const NAV_GROUPS = [
  {
    label: '분석',
    links: [
      { href: '/admin', label: '대시보드' },
      { href: '/admin/hours', label: '시간대 분석' },
    ],
  },
  {
    label: '관리',
    links: [
      { href: '/admin/users', label: '사용자 관리' },
      { href: '/admin/guide', label: '로비 가이드' },
    ],
  },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  function handleLogout() {
    clearSession();
    router.replace('/');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <p className="admin-kicker">STAFF ONLY</p>
        <p className="admin-brand">CINEMO OFFICE</p>
        {user ? <p className="admin-who">{user.nickname}</p> : null}
        <nav className="admin-links">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-link-group">
              <p className="admin-link-group-label">{group.label}</p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href ? 'admin-link--on' : undefined
                  }
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="admin-link-actions">
            <Link href="/?lobby=1" className="admin-link--out">
              CINEMO LOBBY
            </Link>
            <button
              type="button"
              className="admin-link--out"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </nav>
      </aside>
      {children}
    </div>
  );
}
