'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Heart } from 'lucide-react';
import {
  GACHA_ROOMS,
  type GachaMovie,
  type GachaRoomId,
  type TicketStatus,
  type UserMovieKind,
  type UserMovieMarks,
} from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import {
  getTodayTicketRequest,
  useTicketRequest,
  resetTodayTicketRequest,
} from '@/lib/ticket-api';
import {
  getUserMovieMarksRequest,
  toggleUserMovieRequest,
} from '@/lib/user-movie-api';
import { gachaMessage, type CapsulePhase } from '@/lib/gacha-message';
import { MACHINES, type MachineId } from '@/lib/gacha-machines';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { providerLogoUrl } from '@/lib/watch-providers';
import '../styles/gacha.css';
import '../styles/lobby.css';

export default function GachaPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (accessToken === null) router.replace('/login?next=/gacha');
  }, [accessToken, router, hydrated]);

  const [status, setStatus] = useState<TicketStatus | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineId | null>(
    null,
  );
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedMachine, setUsedMachine] = useState<MachineId | null>(null);
  const [capsulePhase, setCapsulePhase] = useState<CapsulePhase>('hidden');
  const [selectedRoom, setSelectedRoom] = useState<GachaRoomId | null>(null);
  const [gachaMovie, setGachaMovie] = useState<GachaMovie | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [marks, setMarks] = useState<UserMovieMarks | null>(null);

  useEffect(() => {
    if (!accessToken || !gachaMovie) {
      setMarks(null);
      return;
    }
    let cancelled = false;
    async function loadMarks() {
      try {
        const res = await getUserMovieMarksRequest(
          accessToken!,
          gachaMovie!.id,
        );
        if (!cancelled) setMarks(res);
      } catch {
        if (!cancelled) setMarks(null);
      }
    }
    void loadMarks();
    return () => {
      cancelled = true;
    };
  }, [accessToken, gachaMovie]);

  async function toggleMark(kind: UserMovieKind) {
    if (!accessToken || !gachaMovie) return;
    setError(null);
    try {
      const res = await toggleUserMovieRequest(
        accessToken,
        gachaMovie.id,
        kind,
      );
      setMarks((prev) => ({
        tmdbId: gachaMovie.id,
        wish: kind === 'wish' ? res.active : (prev?.wish ?? false),
        watched: kind === 'watched' ? res.active : (prev?.watched ?? false),
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  }

  useEffect(() => {
    if (!gachaMovie?.poster_path) {
      setPosterReady(true);
      return;
    }
    setPosterReady(false);
    const src = tmdbPosterUrl(gachaMovie.poster_path, 'w342');
    if (!src) {
      setPosterReady(true);
      return;
    }
    const img = new window.Image();
    img.src = src;
    img.onload = () => setPosterReady(true);
    img.onerror = () => setPosterReady(true);
  }, [gachaMovie]);

  useEffect(() => {
    if (!accessToken || !user) return;
    let cancelled = false;
    async function loadTicket() {
      setError(null);
      try {
        const res = await getTodayTicketRequest(accessToken!);
        if (cancelled) return;
        setStatus(res.status);
        if (
          res.status === 'used' &&
          res.machineId &&
          MACHINES.some((m) => m.id === res.machineId)
        ) {
          const machine = MACHINES.find((m) => m.id === res.machineId)!;
          setUsedMachine(machine.id);
          setSelectedRoom(machine.room);
          setSelectedMachine(machine.id);
          if (res.movie) {
            setGachaMovie(res.movie);
            setCardFlipped(false);
            setCapsulePhase('open');
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(null);
          setError(
            error instanceof Error
              ? error.message
              : '알 수 없는 오류가 발생했습니다.',
          );
        }
      }
    }
    void loadTicket();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  if (!user || !accessToken) {
    return (
      <main className="gacha">
        <header className="gacha-header">
          <div className="gacha-header-nav">
            <Link
              href={user?.role === 'admin' ? '/admin' : '/'}
              className="gacha-header-link"
            >
              {user?.role === 'admin' ? '관리자 화면으로' : '로비로'}
            </Link>
          </div>
          <p className="gacha-kicker">GACHA</p>
          <h1 className="gacha-title">뽑기방</h1>
          <p className="gacha-copy">입장 후 티켓으로 머신을 돌릴 수 있어요.</p>
        </header>
        <div className="gacha-actions">
          <Link href="/login" className="lobby-btn lobby-btn--primary">
            입장하기
          </Link>
        </div>
      </main>
    );
  }

  const canSpin = status === 'issued' && !usedMachine && !spinning;
  const isTestUser = user.nickname === 'test' || user.nickname === 'testuser';
  const roomMachines = selectedRoom
    ? MACHINES.filter((m) => m.room === selectedRoom)
    : [];
  const usedLabel = MACHINES.find((m) => m.id === usedMachine)?.label;
  const selectedRoomLabel = GACHA_ROOMS.find(
    (r) => r.id === selectedRoom,
  )?.label;
  const selectedMachineLabel = MACHINES.find(
    (m) => m.id === selectedMachine,
  )?.label;
  const showSpinDock =
    capsulePhase === 'hidden' &&
    status === 'issued' &&
    !usedMachine &&
    selectedMachine !== null;

  async function spinMachine() {
    if (!selectedMachine || !canSpin) return;
    setSpinning(true);
    setError(null);
    setCapsulePhase('hidden');
    const spinMs = 1100;
    const startedAt = Date.now();
    try {
      const res = await useTicketRequest(accessToken!, selectedMachine);
      const waited = Date.now() - startedAt;
      if (waited < spinMs) {
        await new Promise((r) => window.setTimeout(r, spinMs - waited));
      }
      setGachaMovie(res.movie);

      // overview 없으면 백그라운드 enrich 완료 후 자동 갱신 (사용자 리프레시 불필요)
      if (!res.movie.overview?.trim()) {
        window.setTimeout(async () => {
          try {
            const fresh = await getTodayTicketRequest(accessToken!);
            if (fresh.movie?.overview?.trim()) setGachaMovie(fresh.movie);
          } catch {
            /* silent */
          }
        }, 2500);
      }
      setCardFlipped(false);
      setStatus('used');
      setUsedMachine(selectedMachine);
      setCapsulePhase('dropping');
      window.setTimeout(() => setCapsulePhase('ready'), 700);
    } catch (error) {
      setError(error instanceof Error ? error.message : '뽑기에 실패했습니다.');
    } finally {
      setSpinning(false);
    }
  }

  function openCapsule() {
    if (capsulePhase !== 'ready') return;
    setCapsulePhase('open');
  }

  // test user only
  async function resetToday() {
    setError(null);
    try {
      await resetTodayTicketRequest(accessToken!);
      setStatus('none');
      setUsedMachine(null);
      setSelectedMachine(null);
      setSelectedRoom(null);
      setGachaMovie(null);
      setMarks(null);
      setCardFlipped(false);
      setPosterReady(false);
      setCapsulePhase('hidden');
    } catch (error) {
      setError(error instanceof Error ? error.message : '리셋에 실패했습니다.');
    }
  }

  return (
    <main className={`gacha${showSpinDock ? ' has-spin-dock' : ''}`}>
      <header className="gacha-header">
        <div className="gacha-header-nav">
          {user?.role === 'admin' ? (
            <>
              <Link href="/admin" className="gacha-header-link">
                관리자 화면으로
              </Link>
              <Link href="/?lobby=1" className="gacha-header-link">
                로비로
              </Link>
            </>
          ) : (
            <Link href="/" className="gacha-header-link">
              로비로
            </Link>
          )}

          {isTestUser ? (
            <button
              type="button"
              className="gacha-header-link"
              onClick={resetToday}
            >
              오늘 티켓 리셋
            </button>
          ) : null}
        </div>
        <p className="gacha-kicker">GACHA</p>
        <h1 className="gacha-title">뽑기방</h1>
        <p className="gacha-copy">
          {gachaMessage(capsulePhase, status, usedLabel, selectedRoom)}
        </p>
      </header>

      <div className="gacha-rooms" role="list">
        {GACHA_ROOMS.map((room) => {
          const active = selectedRoom === room.id;
          return (
            <button
              key={room.id}
              type="button"
              role="listitem"
              className={`gacha-room${active ? ' is-selected' : ''}`}
              data-room={room.id}
              disabled={!canSpin}
              onClick={() => {
                setSelectedRoom(room.id);
                setSelectedMachine(null);
              }}
            >
              <span className="gacha-room-kicker">{room.id.toUpperCase()}</span>
              <span className="gacha-room-label">{room.label}</span>
            </button>
          );
        })}
      </div>

      {selectedRoom ? (
        <div className="gacha-floor">
          <p className="gacha-floor-label">{selectedRoomLabel}</p>
          <div className="gacha-row" role="list">
            {roomMachines.map((machine) => {
              const active = selectedMachine === machine.id;
              const isSpinningHere = spinning && active;
              const wasUsed = usedMachine === machine.id;
              return (
                <button
                  key={machine.id}
                  type="button"
                  role="listitem"
                  className={`gacha-machine${active ? ' is-selected' : ''}${isSpinningHere ? ' is-spinning' : ''}${wasUsed ? ' is-used' : ''}`}
                  data-id={machine.id}
                  disabled={!canSpin}
                  onClick={() => setSelectedMachine(machine.id)}
                >
                  <span className="gacha-machine-window">
                    <span className="gacha-machine-kicker">
                      {machine.kicker}
                    </span>
                    <span className="gacha-machine-name">{machine.label}</span>
                    <span className="gacha-machine-sub">CAPSULE</span>
                  </span>
                  <span className="gacha-machine-panel">
                    <span className="gacha-machine-knob" aria-hidden>
                      <span className="gacha-machine-knob-stem" />
                      <span className="gacha-machine-knob-bar" />
                    </span>
                    <span className="gacha-machine-slot" aria-hidden />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="gacha-empty">방을 선택하면 머신이 나타납니다</p>
      )}

      {capsulePhase !== 'hidden' ? (
        <div
          className="gacha-modal"
          role="dialog"
          aria-modal="true"
          aria-label="뽑기 결과"
        >
          <div className="gacha-modal-backdrop" aria-hidden />
          <div className="gacha-modal-content">
            {capsulePhase === 'open' && gachaMovie ? (
              <div className="gacha-result">
                <p className="gacha-result-kicker">{usedLabel}</p>
                <button
                  type="button"
                  className={`gacha-flip${cardFlipped ? ' is-flipped' : ''}`}
                  onClick={() => setCardFlipped((v) => !v)}
                  aria-label={cardFlipped ? '포스터 보기' : '줄거리 보기'}
                >
                  <span className="gacha-flip-inner">
                    <span className="gacha-flip-face gacha-flip-face--front">
                      <span
                        className={`gacha-flip-poster${posterReady ? ' is-ready' : ''}`}
                      >
                        {gachaMovie.poster_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              tmdbPosterUrl(gachaMovie.poster_path, 'w342') ??
                              undefined
                            }
                            alt={gachaMovie.title}
                          />
                        ) : (
                          <span className="gacha-flip-poster-empty">
                            <span className="gacha-flip-poster-empty-title">
                              {gachaMovie.title}
                            </span>
                            <span className="gacha-flip-poster-empty-label">
                              포스터 준비 중
                            </span>
                          </span>
                        )}
                      </span>
                      <span className="gacha-flip-meta">
                        <span className="gacha-flip-title">
                          {gachaMovie.title}
                        </span>
                        <span className="gacha-flip-hint">탭해서 뒤집기</span>
                      </span>
                    </span>
                    <span className="gacha-flip-face gacha-flip-face--back">
                      <span className="gacha-flip-back-title">
                        {gachaMovie.title}
                      </span>
                      <span className="gacha-flip-facts">
                        <span>
                          {gachaMovie.release_date?.slice(0, 4) || '----'}
                        </span>
                        {gachaMovie.director ? (
                          <span>감독 · {gachaMovie.director}</span>
                        ) : null}
                      </span>
                      <span
                        className="gacha-flip-overview"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {gachaMovie.overview?.trim() ||
                          '줄거리가 아직 없어요. 포스터 면을 다시 봐 보세요.'}
                      </span>
                      <span className="gacha-flip-hint">탭해서 포스터</span>
                    </span>
                  </span>
                </button>
              </div>
            ) : (
              <div className="gacha-stage">
                <button
                  type="button"
                  className={`gacha-capsule is-${capsulePhase}${usedMachine ? ` is-${usedMachine}` : ''}`}
                  onClick={openCapsule}
                  disabled={capsulePhase !== 'ready'}
                  aria-label="캡슐 열기"
                >
                  <span className="gacha-capsule-shell" aria-hidden>
                    <span className="gacha-capsule-half gacha-capsule-half--top" />
                    <span className="gacha-capsule-half gacha-capsule-half--bottom" />
                    <span className="gacha-capsule-shine" />
                  </span>
                </button>
                {capsulePhase === 'ready' ? (
                  <p className="gacha-capsule-hint">클릭해보세요</p>
                ) : null}
                {capsulePhase === 'dropping' ? (
                  <p className="gacha-capsule-hint">캡슐이 나왔어요…</p>
                ) : null}
              </div>
            )}
            <div className="gacha-modal-actions">
              {capsulePhase === 'open' && gachaMovie?.providers?.length ? (
                <div className="gacha-providers">
                  {gachaMovie.providers.map((p) => (
                    <img
                      key={p.id}
                      src={providerLogoUrl(p.logo_path)}
                      alt={p.name}
                      title={p.name}
                      className="gacha-provider-logo"
                    />
                  ))}
                </div>
              ) : null}
              {capsulePhase === 'open' && gachaMovie ? (
                <div className="gacha-marks">
                  <button
                    type="button"
                    className={`gacha-mark${marks?.wish ? ' is-on' : ''}`}
                    onClick={() => void toggleMark('wish')}
                    aria-pressed={marks?.wish ?? false}
                  >
                    <Heart
                      size={15}
                      strokeWidth={1.75}
                      fill={marks?.wish ? 'currentColor' : 'none'}
                      aria-hidden
                    />
                    <span>찜</span>
                  </button>
                  <button
                    type="button"
                    className={`gacha-mark${marks?.watched ? ' is-on' : ''}`}
                    onClick={() => void toggleMark('watched')}
                    aria-pressed={marks?.watched ?? false}
                  >
                    <Check size={15} strokeWidth={2} aria-hidden />
                    <span>봤어요</span>
                  </button>
                </div>
              ) : null}
              <div className="gacha-modal-nav">
                {user?.role === 'admin' ? (
                  <>
                    <Link href="/admin" className="gacha-nav-link">
                      관리자 화면으로
                    </Link>
                    <Link href="/?lobby=1" className="gacha-nav-link">
                      로비로
                    </Link>
                  </>
                ) : (
                  <Link href="/" className="gacha-nav-link">
                    로비로
                  </Link>
                )}

                {isTestUser ? (
                  <button
                    type="button"
                    className="gacha-nav-link"
                    onClick={resetToday}
                  >
                    오늘 티켓 리셋
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="gacha-copy">{error}</p> : null}

      {showSpinDock ? (
        <div className="gacha-spin-dock">
          <p className="gacha-spin-dock-label">{selectedMachineLabel}</p>
          <button
            type="button"
            className="lobby-btn lobby-btn--primary"
            disabled={spinning}
            onClick={spinMachine}
          >
            레버 돌리기
          </button>
        </div>
      ) : null}
    </main>
  );
}
