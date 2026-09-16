'use client';

import { AdminProviderOverrides } from '@/components/admin/AdminProviderOverrides';
import { useAuthStore } from '@/lib/auth-store';

export default function AdminOpsPage() {
  const token = useAuthStore((s) => s.accessToken);

  return (
    <main className="admin-main">
      <h1 className="admin-title">콘텐츠 운영</h1>
      <p className="admin-sub">영화관 정보와 OTT 제공처 예외를 관리합니다.</p>
      <section className="admin-ops-grid">
        <AdminProviderOverrides token={token} />
      </section>
    </main>
  );
}
