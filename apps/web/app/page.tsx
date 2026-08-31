'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ADMIN_AVATAR, type TicketStatus } from '@cinemo/shared';
import { Coffee, Film, MessageCircle, Quote } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { TicketBooth } from '@/components/lobby/TicketBooth';
import './styles/lobby.css';
import './styles/avatar.css';
import './styles/guide.css';
import { LobbyBoard } from '@/components/lobby/LobbyBoard';
import { WeeklyRevealModal } from '@/components/lobby/WeeklyRevealModal';
import { useWeeklyReveal } from '@/hooks/useWeeklyReveal';
import { AvatarFigure } from '@/components/room/AvatarFigure';
import { useGuideStore } from '@/lib/guide-store';
import { LobbyGuideModal } from '@/components/lobby/LobbyGuideModal';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const guidePending = useGuideStore((s) => s.pending);
  const lit = Boolean(user);
  const [, setTicketStatus] = useState<TicketStatus | null>(null);
  const stayLobby = searchParams.get('lobby') === '1';
  const { winner, dismiss } = useWeeklyReveal(user?.id);

  const hydrated = useAuthStore((s) => s.hydrated);

  const isAdminEntry = hydrated && user?.role === 'admin' && !stayLobby;
  const shouldWaitForAuth =
    !hydrated || (Boolean(accessToken) && !user && !stayLobby);

  useEffect(() => {
    if (isAdminEntry) {
      router.replace('/admin');
    }
  }, [isAdminEntry, router]);

  if (shouldWaitForAuth || isAdminEntry) {
    return null;
  }

  return (
    <main className={`lobby ${lit ? 'lobby--lit' : 'lobby--dim'}`}>
      <div className="lobby-atmosphere" aria-hidden />

      {guidePending ? <LobbyGuideModal onClose={() => undefined} /> : null}

      {winner ? (
        <WeeklyRevealModal
          winner={winner}
          accessToken={accessToken}
          onClose={dismiss}
        />
      ) : null}

      <div className="lobby-stage">
        <LobbyBoard />

        <div className="lobby-hall">
          <div className="lobby-counter-row">
            <section className="lobby-counter" aria-label="로비 중앙 매표소">
              <TicketBooth onStatusChange={setTicketStatus} />
            </section>

            <div className="lobby-guest" aria-label={user ? user.nickname : '손님'}>
              <div className="lobby-guest-bar">
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
                    user?.role === 'admin' ? '/admin' : user ? '/room' : '/login'
                  }
                  className="lobby-mat"
                  aria-label={
                    user?.role === 'admin'
                      ? '관리자 화면'
                      : user
                        ? '내 방'
                        : '입장 후 내 방'
                  }
                >
                  <span className="lobby-mat-label">
                    {user?.role === 'admin' ? 'CINEMO OFFICE' : 'MY ROOM'}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <nav className="lobby-destinations" aria-label="CINEMO 공간">
            <Link href="/quote" className="lobby-destination">
              <Quote className="lobby-destination-icon" aria-hidden />
              <span className="lobby-destination-kicker">QUOTE REEL</span>
              <span className="lobby-destination-label">명대사방</span>
            </Link>
            <Link href="/gacha" className="lobby-destination">
              <Film className="lobby-destination-icon" aria-hidden />
              <span className="lobby-destination-kicker">GACHA</span>
              <span className="lobby-destination-label">뽑기방</span>
            </Link>
            <Link href="/review" className="lobby-destination">
              <MessageCircle className="lobby-destination-icon" aria-hidden />
              <span className="lobby-destination-kicker">REVIEW BALL</span>
              <span className="lobby-destination-label">후기방</span>
            </Link>
            <Link href="/cafe" className="lobby-destination">
              <Coffee className="lobby-destination-icon" aria-hidden />
              <span className="lobby-destination-kicker">SNACK BAR</span>
              <span className="lobby-destination-label">카페</span>
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
