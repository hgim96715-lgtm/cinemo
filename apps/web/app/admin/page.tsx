'use client';

import { useEffect, useState } from 'react';
import type { AdminOverview, MoviePoolSeedRun } from '@cinemo/shared';
import {
  AdminWeekPeople,
  AdminWeekTickets,
} from '@/components/admin/AdminCharts';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { getAdminOverviewRequest } from '@/lib/admin-api';
import { useAuthStore } from '@/lib/auth-store';
import { getLatestSeedRunRequest } from '@/lib/tmdb-api';
import { AdminSeedRunModal } from '@/components/admin/AdminSeedRunModal';
import { AdminDailyExcelCard } from '@/components/admin/AdminDailyExcelCard';
import { formatKstDateKey, kstDateKey } from '@/lib/date-kst';

function seedSeenKey(userId: string) {
  return `cinemo_admin_seed_seen:${userId}`;
}

export default function AdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [seedRun, setSeedRun] = useState<MoviePoolSeedRun | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    analytics,
    error: chartError,
    loading: chartLoading,
  } = useAdminAnalytics();

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let cancelled = false;
    async function loadOverview() {
      try {
        const data = await getAdminOverviewRequest(token);
        if (!cancelled) setOverview(data);
      } catch (error) {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : '현황을 불러오는데 실패했습니다.',
          );
      }
    }
    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !user) return;

    const token = accessToken;
    const userId = user.id;
    let cancelled = false;

    async function loadLatestSeedRun() {
      try {
        const response = await getLatestSeedRunRequest(token);
        const latest = response.run;
        const seenId = localStorage.getItem(seedSeenKey(userId));

        console.log('[AdminPage] 시드 모달 조건 확인', {
          response,
          latest,
          latestId: latest?.id,
          seenId,
          shouldShow: Boolean(latest && latest.id !== seenId),
        });

        if (
          cancelled ||
          !latest ||
          localStorage.getItem(seedSeenKey(userId)) === latest.id
        ) {
          return;
        }

        setSeedRun(latest);
      } catch (error) {
        console.error('[AdminPage] MoviePool 시드 결과 조회 실패:', error);
        if (!cancelled) {
          setError(
            error instanceof Error
              ? `MoviePool 결과 조회 실패: ${error.message}`
              : 'MoviePool 결과 조회 실패',
          );
        }
      }
    }

    void loadLatestSeedRun();

    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  function closeSeedRunModal() {
    if (user && seedRun && seedRun.status !== 'running') {
      localStorage.setItem(seedSeenKey(user.id), seedRun.id);
    }

    setSeedRun(null);
  }

  return (
    <main className="admin-main">
      <h1 className="admin-title">{formatKstDateKey(kstDateKey())}</h1>

      <p className="admin-sub">
        로비 = 로그인 손님 입장 하루 1회 · 구경 = 비로그인 후기방
      </p>

      {error ? <p className="admin-error">{error}</p> : null}

      {accessToken ? <AdminDailyExcelCard token={accessToken} /> : null}

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
            <li>
              구경
              <strong>{overview.todayAnonReviewCount}</strong>
            </li>
            <li>
              후기
              <strong>{overview.reviewCount}</strong>
            </li>
            <li>
              티켓
              <strong>{overview.todayTicketIssuedCount}</strong>
            </li>
            <li>
              카페
              <strong>{overview.cafeSeatedCount}</strong>
            </li>
          </ul>

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
            <li>
              구경
              <strong>{overview.weekAnonReviewCount}</strong>
            </li>
          </ul>
        </>
      ) : null}

      <h2 className="admin-section">최근 7일</h2>
      <p className="admin-sub admin-sub--tight">날짜별 인원 · 선 / 비중</p>

      {chartError ? <p className="admin-error">{chartError}</p> : null}
      {chartLoading ? <p className="admin-status">불러오는 중…</p> : null}

      {analytics ? <AdminWeekPeople analytics={analytics} /> : null}

      <h2 className="admin-section">티켓</h2>
      <p className="admin-sub admin-sub--tight">발급 / 사용</p>

      {analytics ? <AdminWeekTickets analytics={analytics} /> : null}

      {seedRun ? (
        <AdminSeedRunModal run={seedRun} onClose={closeSeedRunModal} />
      ) : null}
    </main>
  );
}
