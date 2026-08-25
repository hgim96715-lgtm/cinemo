'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { TicketStatus } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import { TicketBooth } from '@/components/lobby/TicketBooth';
import { guestTicketLabel } from '@/lib/lobby-speech';
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
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);
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
          <div className="lobby-doors lobby-doors--left">
            <Link href="/gacha" className="lobby-door">
              <span className="lobby-door-frame" aria-hidden />
              <span className="lobby-door-label">뽑기방</span>
            </Link>
          </div>

          <section className="lobby-counter" aria-label="로비 중앙 매표소">
            <TicketBooth onStatusChange={setTicketStatus} />
          </section>

          <div className="lobby-doors lobby-doors--right">
            <Link href="/review" className="lobby-door">
              <span className="lobby-door-frame" aria-hidden />
              <span className="lobby-door-label">후기방</span>
            </Link>
            <Link href="/cafe" className="lobby-door">
              <span className="lobby-door-frame" aria-hidden />
              <span className="lobby-door-label">카페</span>
            </Link>
          </div>
        </div>

        <div className="lobby-guest" aria-label={user ? user.nickname : '손님'}>
          <div className="lobby-guest-bar">
            <div className="lobby-guest-identity">
              <AvatarFigure config={user?.avatarConfig} />
              <p className="lobby-guest-name">
                {user ? user.nickname : '손님'}
              </p>
            </div>
            <p className="lobby-guest-ticket">
              <span className="lobby-ticket-stub">TICKET</span>
              {user ? guestTicketLabel(ticketStatus) : '입장 전 · 티켓 없음'}
            </p>
            <Link
              href={user ? '/room' : '/login'}
              className="lobby-mat"
              aria-label={user ? '내 방' : '입장 후 내 방'}
            >
              <span className="lobby-mat-label">MY ROOM</span>
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
