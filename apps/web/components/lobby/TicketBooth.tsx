'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { TicketStatus } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import { getTodayTicketRequest, issueTicketRequest } from '@/lib/ticket-api';
import { staffSpeech } from '@/lib/lobby-speech';
import { Staff } from '@/components/lobby/Staff';

type Props = {
  onStatusChange: (status: TicketStatus | null) => void;
};

export function TicketBooth({ onStatusChange }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [status, setStatus] = useState<TicketStatus | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTicket, setShowTicket] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showTicket) return;

    const id = window.setTimeout(() => setShowTicket(false), 2200);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTicket(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showTicket]);

  useEffect(() => {
    if (!accessToken || !user || user.role === 'admin') {
      setStatus(null);
      onStatusChange(null);
      return;
    }
    let cancelled = false;
    async function loadStatus() {
      setError(null);
      try {
        const res = await getTodayTicketRequest(accessToken!);
        if (cancelled) return;
        setStatus(res.status);
        onStatusChange(res.status);
      } catch (error) {
        if (cancelled) return;
        setStatus(null);
        onStatusChange(null);
        setError(
          error instanceof Error
            ? error.message
            : '티켓 상태를 불러오는 중 오류가 발생했습니다.',
        );
      }
    }
    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user, onStatusChange]);

  async function issueTicket() {
    if (!accessToken) return;
    setIssuing(true);
    setError(null);
    try {
      await issueTicketRequest(accessToken);
      setStatus('issued');
      onStatusChange('issued');
      setShowTicket(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '티켓 발급 중 오류가 발생했습니다.',
      );
    } finally {
      setIssuing(false);
    }
  }

  const canIssue =
    user?.role !== 'admin' &&
    Boolean(user) &&
    (status === 'none' || status === null);

  function onStaffPersonClick() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (canIssue && !issuing) {
      void issueTicket();
    }
  }

  const ticketOverlay =
    mounted && showTicket && user
      ? createPortal(
          <div
            className="ticket-stub-overlay"
            onClick={() => setShowTicket(false)}
          >
            <div
              className="ticket-stub"
              role="status"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="ticket-stub-kicker">CINEMO</p>
              <p className="ticket-stub-title">오늘 뽑기권</p>
              <p className="ticket-stub-meta">{user.nickname}</p>
              <span className="ticket-stub-perforation" aria-hidden />
              <Link
                href="/gacha"
                className="ticket-stub-cta"
                onClick={() => setShowTicket(false)}
              >
                뽑기하러 가기
              </Link>
            </div>
          </div>,
          document.body,
        )
      : null;

  const staffPersonLabel = !user
    ? '직원 · 입장하기'
    : canIssue
      ? '직원 · 티켓 발급받기'
      : '직원';

  return (
    <>
      <Staff
        speech={staffSpeech(user?.nickname, status, user?.role)}
        onPersonClick={!user || canIssue ? onStaffPersonClick : undefined}
        personLabel={staffPersonLabel}
      />

      <div className="lobby-desk">
        <div className="lobby-desk-awning" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="lobby-desk-plate">
          <p className="lobby-desk-title">TICKET</p>
          <p className="lobby-desk-subtitle">티켓 창구</p>
        </div>
        {error ? <p className="lobby-desk-copy">{error}</p> : null}
        <div className="lobby-desk-actions">
          {user?.role === 'admin' ? (
            <span className="lobby-desk-hint">운영자 모드</span>
          ) : !user ? (
            <>
              <Link href="/login" className="lobby-btn lobby-btn--primary">
                입장하기
              </Link>
              <Link href="/register" className="lobby-btn">
                회원가입
              </Link>
            </>
          ) : status === 'issued' ? (
            <p className="lobby-desk-status">
              <span className="lobby-desk-status-kicker">오늘 티켓</span>
              <span className="lobby-desk-status-value">사용 가능</span>
            </p>
          ) : status === 'used' ? (
            <p className="lobby-desk-status lobby-desk-status--used">
              <span className="lobby-desk-status-kicker">오늘 티켓</span>
              <span className="lobby-desk-status-value">사용 완료</span>
            </p>
          ) : (
            <span className="lobby-desk-hint">
              직원을 눌러 티켓을 받아보세요
            </span>
          )}
        </div>
        <div className="lobby-desk-rail" aria-hidden />
      </div>
      {ticketOverlay}
    </>
  );
}
