'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const LINKS = [
  { href: '/admin', label: '현황' },
  { href: '/admin/ops', label: '운영' },
  { href: '/admin/cafe', label: '카페' },
  { href: '/admin/guide', label: '로비 가이드' },
  { href: '/admin/users', label: '사용자' },
  { href: '/admin/hours', label: '시간' },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <p className="admin-kicker">STAFF ONLY</p>
        <p className="admin-brand">CINEMO OFFICE</p>
        {user ? <p className="admin-who">{user.nickname}</p> : null}
        <nav className="admin-links">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'admin-link--on' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/?lobby=1" className="admin-link--out">
            로비로
          </Link>
        </nav>
      </aside>
      {children}
    </div>
  );
}
