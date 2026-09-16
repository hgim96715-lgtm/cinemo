'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ADMIN_AVATAR } from '@cinemo/shared';
import { CalendarClock, Clapperboard, Images } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import '@/styles/lobby.css';
import '@/styles/avatar.css';
import '@/styles/guide.css';
import { LobbyBoard } from '@/components/lobby/LobbyBoard';
import { AvatarFigure } from '@/components/my-cinema/AvatarFigure';
import { useGuideStore } from '@/lib/guide-store';
import { LobbyGuideModal } from '@/components/lobby/LobbyGuideModal';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const guidePending = useGuideStore((s) => s.pending);
  const previewGuide = useGuideStore((s) => s.previewGuide);
  const lit = Boolean(user);
  const stayLobby = searchParams.get('lobby') === '1';

  const hydrated = useAuthStore((s) => s.hydrated);

  const isAdminEntry = hydrated && user?.role === 'admin' && !stayLobby;
  const shouldWaitForAuth =
    !hydrated || (Boolean(accessToken) && !user && !stayLobby);

  useEffect(() => {
    if (isAdminEntry) {
      router.replace('/admin');
    }
  }, [isAdminEntry, router]);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      hydrated &&
      user &&
      searchParams.get('guide') === 'preview'
    ) {
      previewGuide();
    }
  }, [hydrated, previewGuide, searchParams, user]);

  if (shouldWaitForAuth || isAdminEntry) {
    return null;
  }

  return (
    <main className={`lobby ${lit ? 'lobby--lit' : 'lobby--dim'}`}>
      <div className="lobby-atmosphere" aria-hidden />

      {guidePending ? <LobbyGuideModal onClose={() => undefined} /> : null}

      <div className="lobby-stage">
        <LobbyBoard />

        <div className="lobby-feature-links">
          <Link
            href="/moviechart"
            className="lobby-feature-card lobby-feature-card--chart"
            aria-label="MOVIE CHART 보기"
          >
            <span className="lobby-feature-kicker">MOVIE CHART</span>
            <strong>오늘의 순위와 이번 달 흐름</strong>
            <span className="lobby-feature-description">
              관객수와 순위 변화를 확인해보세요
            </span>

            <Clapperboard
              className="lobby-feature-icon"
              size={30}
              strokeWidth={1.8}
              aria-hidden
            />
          </Link>

          <Link
            href="/upcoming"
            className="lobby-feature-card lobby-feature-card--upcoming"
            aria-label="곧 스크린에서 만날 영화"
          >
            <span className="lobby-feature-kicker">COMING SOON</span>
            <strong>곧 스크린에서 만날 영화</strong>
            <span className="lobby-feature-description">
              개봉일을 확인하고 미리 찜해보세요
            </span>

            <CalendarClock
              className="lobby-feature-icon"
              size={30}
              strokeWidth={1.8}
              aria-hidden
            />
          </Link>

          <Link
            href="/postcard"
            className="lobby-feature-card lobby-feature-card--postcard"
            aria-label="CINEMO 엽서 보기"
          >
            <span className="lobby-feature-kicker">POSTCARD</span>
            <strong>영화를 한 장의 엽서로</strong>
            <span className="lobby-feature-description">
              마음에 남은 영화를 기록하고 공유해보세요
            </span>

            <Images
              className="lobby-feature-icon"
              size={30}
              strokeWidth={1.8}
              aria-hidden
            />
          </Link>
        </div>

        <div className="lobby-hall">
          <div className="lobby-guest" aria-label={user ? user.nickname : '손님'}>
            <div className="lobby-guest-identity">
              <AvatarFigure
                config={
                  user?.role === 'admin' ? ADMIN_AVATAR : user?.avatarConfig
                }
              />
              <p className="lobby-guest-name">
                {user ? user.nickname : '손님'}
              </p>
            </div>

            <Link
              href={
                user?.role === 'admin'
                  ? '/admin'
                  : user
                    ? '/my-cinema'
                    : '/login'
              }
              className="lobby-mat lobby-mat--primary"
              aria-label={
                user?.role === 'admin'
                  ? 'CINEMO OFFICE'
                  : user
                    ? 'MY CINEMA'
                    : '로그인 후 MY CINEMA 입장'
              }
            >
              <span className="lobby-mat-label">
                {user?.role === 'admin' ? 'CINEMO OFFICE' : 'MY CINEMA'}
              </span>

              {user?.role !== 'admin' ? (
                <span className="lobby-mat-description">
                  관람 기록 · 영화 달력 · 영화 통계
                </span>
              ) : null}
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
