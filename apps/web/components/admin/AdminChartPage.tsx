'use client';

import { useAdminAnalytics } from '@/hooks/admin/useAdminAnalytics';

type Props = {
  title: string;
  sub: string;
  children: (analytics: NonNullable<
    ReturnType<typeof useAdminAnalytics>['analytics']
  >) => React.ReactNode;
};

export function AdminChartPage({ title, sub, children }: Props) {
  const { analytics, error, loading } = useAdminAnalytics();

  return (
    <main className="admin-main">
      <h1 className="admin-title">{title}</h1>
      <p className="admin-sub">{sub}</p>
      {error ? <p className="admin-error">{error}</p> : null}
      {loading ? <p className="admin-status">불러오는 중…</p> : null}
      {analytics ? children(analytics) : null}
    </main>
  );
}
