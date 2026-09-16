'use client';

import { useEffect, useState } from 'react';
import type { AdminOverview } from '@cinemo/shared';
import { AdminWeekPeople } from '@/components/admin/AdminCharts';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { getAdminOverviewRequest } from '@/lib/admin-api';
import { useAuthStore } from '@/lib/auth-store';
import { formatKstDateKey, kstDateKey } from '@/lib/date-kst';

export default function AdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { analytics, error: chartError, loading: chartLoading } =
    useAdminAnalytics();

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let cancelled = false;

    async function loadOverview() {
      try {
        const data = await getAdminOverviewRequest(token);
        if (!cancelled) setOverview(data);
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '현황을 불러오는데 실패했습니다.',
          );
        }
      }
    }

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <main className="admin-main">
      <h1 className="admin-title">대시보드</h1>
      <p className="admin-sub">
        {formatKstDateKey(kstDateKey())} · 로비 이용 현황과 최근 활동
      </p>

      {error ? <p className="admin-error">{error}</p> : null}
      {!overview && !error ? (
        <p className="admin-status">불러오는 중…</p>
      ) : null}

      {overview ? (
        <>
          <ul className="admin-cards">
            <li>
              전체
              <strong>{overview.userCount}</strong>
            </li>
            <li>
              가입
              <strong>{overview.todaySignupCount}</strong>
            </li>
            <li>
              로비
              <strong>{overview.todayVisitCount}</strong>
            </li>
          </ul>

          <table className="admin-today-table">
            <caption>오늘 통계</caption>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">오늘 합계</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">로비 방문</th>
                <td>{overview.todayVisitCount}명</td>
              </tr>
            </tbody>
          </table>

          <h2 className="admin-section">이번주</h2>
          <p className="admin-sub admin-sub--tight">월–오늘</p>
          <ul className="admin-cards">
            <li>
              가입
              <strong>{overview.weekSignupCount}</strong>
            </li>
            <li>
              로비
              <strong>{overview.weekVisitCount}</strong>
            </li>
          </ul>
        </>
      ) : null}

      <h2 className="admin-section">최근 7일</h2>
      <p className="admin-sub admin-sub--tight">날짜별 인원 · 선 / 비중</p>
      {chartError ? <p className="admin-error">{chartError}</p> : null}
      {chartLoading ? <p className="admin-status">불러오는 중…</p> : null}
      {analytics ? <AdminWeekPeople analytics={analytics} /> : null}
    </main>
  );
}
