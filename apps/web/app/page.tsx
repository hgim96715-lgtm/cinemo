'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ADMIN_AVATAR, type TicketStatus } from '@cinemo/shared';
import { CalendarClock, Images, Volleyball } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { TicketBooth } from '@/components/lobby/TicketBooth';
import './styles/lobby.css';
import './styles/avatar.css';
import './styles/guide.css';
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
  const [, setTicketStatus] = useState<TicketStatus | null>(null);
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
        <Link
          href="/upcoming"
          className="lobby-upcoming-card"
          aria-label="곧 스크린에서 만날 영화"
        >
          <span className="lobby-upcoming-kicker">COMING SOON</span>
          <strong>곧 스크린에서 만날 영화</strong>
          <span className="lobby-upcoming-description">
            개봉일을 확인하고 미리 찜해보세요
          </span>

          <CalendarClock
            className="lobby-upcoming-icon"
            size={30}
            strokeWidth={1.8}
            aria-hidden
          />
        </Link>

        <div className="lobby-hall">
          <div className="lobby-counter-row">
            <section className="lobby-counter" aria-label="로비 중앙 매표소">
              <TicketBooth onStatusChange={setTicketStatus} />
            </section>

            <div
              className="lobby-guest"
              aria-label={user ? user.nickname : '손님'}
            >
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

          <nav className="lobby-destinations" aria-label="CINEMO 공간">
            <Link href="/gacha" className="lobby-destination">
              <Volleyball className="lobby-destination-icon" aria-hidden />
              <span className="lobby-destination-kicker">TICKET BOOTH</span>
              <span className="lobby-destination-label">뽑기방</span>
            </Link>
            <Link href="/postcard" className="lobby-destination">
              <Images className="lobby-destination-icon" aria-hidden="true" />
              <span className="lobby-destination-kicker">POSTCARD</span>
              <span className="lobby-destination-label">CINEMO 엽서</span>
            </Link>
          </nav>
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
