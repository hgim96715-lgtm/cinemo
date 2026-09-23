'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarClock,
  CalendarDays,
  Clapperboard,
  Images,
  LibraryBig,
  MapPinned,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import '@/styles/lobby.css';
import '@/styles/feature-link-card.css';
import '@/styles/common.css';
import '@/styles/cinemo-nav.css';
import '@/styles/cinemo-page-header.css';
import { LobbyBoard } from '@/components/lobby/LobbyBoard';
import { kstLobbyDateLabel } from '@/lib/date-kst';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';
import { FeatureLinkCard } from '@/components/common/FeatureLinkCard';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const stayLobby = searchParams.get('lobby') === '1';
  const [dateLabel, setDateLabel] = useState('');

  const hydrated = useAuthStore((s) => s.hydrated);

  const isAdminEntry = hydrated && user?.role === 'admin' && !stayLobby;
  const shouldWaitForAuth =
    !hydrated || (Boolean(accessToken) && !user && !stayLobby);

  useEffect(() => {
    const updateDate = () => setDateLabel(kstLobbyDateLabel());
    updateDate();

    const timerId = window.setInterval(updateDate, 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (isAdminEntry) {
      router.replace('/admin');
    }
  }, [isAdminEntry, router]);

  if (shouldWaitForAuth || isAdminEntry) {
    return null;
  }

  return (
    <main className="lobby">
      <div className="lobby-atmosphere" aria-hidden />

      <div className="lobby-stage">
        <CinemoPageHeader
          className="lobby-page-header"
          eyebrow="CINEMO LOBBY"
          title="CINEMO"
          titleClassName="lobby-page-title"
        >
          <p className="lobby-page-date">
            <CalendarDays className="lobby-page-date-icon" aria-hidden />
            <span suppressHydrationWarning>{dateLabel || '—'}</span>
          </p>
        </CinemoPageHeader>

        <LobbyBoard />

        <div className="lobby-feature-links">
          <FeatureLinkCard
            href="/moviechart"
            className="lobby-feature-card--chart"
            ariaLabel="MOVIE CHART 보기"
            kicker="MOVIE CHART"
            title="오늘의 순위와 이번 달 흐름"
            description="관객수와 순위 변화를 확인해보세요"
            icon={
              <Clapperboard
                size={30}
                strokeWidth={1.8}
              />
            }
          />

          <FeatureLinkCard
            href="/upcoming"
            className="lobby-feature-card--upcoming"
            ariaLabel="곧 스크린에서 만날 영화"
            kicker="COMING SOON"
            title="곧 스크린에서 만날 영화"
            description="개봉일을 확인하고 미리 찜해보세요"
            icon={
              <CalendarClock
                size={30}
                strokeWidth={1.8}
              />
            }
          />

          <FeatureLinkCard
            href="/postcard"
            className="lobby-feature-card--postcard"
            ariaLabel="CINEMO 엽서 보기"
            kicker="POSTCARD"
            title="영화를 한 장의 엽서로"
            description="마음에 남은 영화를 기록하고 공유해보세요"
            icon={
              <Images
                size={30}
                strokeWidth={1.8}
              />
            }
          />

          <FeatureLinkCard
            href="/cinema-map"
            className="lobby-feature-card--cinema-map"
            ariaLabel="지역별 영화관 탐색"
            kicker="CINEMA MAP"
            title="지역별 영화관 탐색"
            description="내 주변 영화관을 지도에서 찾아보세요"
            icon={
              <MapPinned
                size={30}
                strokeWidth={1.8}
              />
            }
          />
        </div>

        <div className="lobby-hall">
          <div className="lobby-guest" aria-label={user ? user.nickname : '손님'}>
            <Link
              href={
                user?.role === 'admin'
                  ? '/admin'
                  : user
                    ? '/my-cinema'
                    : '/login'
              }
              className="lobby-ticket"
              aria-label={user ? 'MY CINEMA 입장' : '로그인 후 MY CINEMA 입장'}
            >
              <span className="lobby-ticket-main">
                <span className="lobby-ticket-eyebrow">CINEMO TICKET</span>
                <strong>{user ? user.nickname : 'GUEST'}</strong>
                <span className="lobby-ticket-description">
                  {user?.role === 'admin'
                    ? 'CINEMO OFFICE'
                    : '관람 기록 · 영화 달력 · 영화 통계'}
                </span>
                <span className="lobby-ticket-meta" aria-label="티켓 정보">
                  <span>
                    <small>WATCHED</small>
                    --
                  </span>
                </span>
              </span>

              <span className="lobby-ticket-side">
                <LibraryBig
                  className="lobby-ticket-icon"
                  size={28}
                  strokeWidth={1.8}
                  aria-hidden
                />
                <span className="lobby-ticket-label">
                  {user?.role === 'admin' ? 'OFFICE' : 'MY CINEMA'}
                </span>
                <span className="lobby-ticket-number">
                  {user ? 'ADMIT ONE' : 'ADMIT ONE · --'}
                </span>
                <span className="lobby-ticket-barcode" aria-hidden="true" />
              </span>
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
