'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_AVATAR,
  type GachaMovie,
  type AvatarConfig,
  type UserMovieCounts,
} from '@cinemo/shared';
import { useAuthStore, type UpdateProfileInput } from '@/lib/auth-store';
import { updateAvatarRequest, updateProfileRequest } from '@/lib/auth-api';
import { AvatarFigure } from '@/components/my-cinema/AvatarFigure';
import { WardrobeModal } from '@/components/my-cinema/WardrobeModal';
import { ProfileModal } from '@/components/my-cinema/ProfileModal';
import {
  addWatchedMovieRequest,
  getUserMovieCountsRequest,
  listDisplayedUserMoviesRequest,
  listUserMoviesRequest,
  removeWatchedMovieRequest,
  updateUserMovieDisplayRequest,
  updateWatchedAtRequest,
} from '@/lib/user-movie-api';
import '../styles/my-cinema.css';
import '../styles/lobby.css';
import '../styles/avatar.css';
import '../styles/profile.css';
import '../styles/common.css';
import {
  CalendarDays,
  Clapperboard,
  Heart,
  Phone,
  Popcorn,
  Plus,
  Shirt,
  ArrowUpRight,
  Mail,
} from 'lucide-react';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { PosterPickerModal } from '@/components/my-cinema/PosterPickerModal';
import { MovieCalendarModal } from '@/components/my-cinema/MovieCalendarModal';
import { WatchedDateEditModal } from '@/components/my-cinema/WatchedDateEditModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { MovieStatsPanel } from '@/components/my-cinema/MovieStatsPanel';
import '../styles/confirm-modal.css';
import { CinemoNav } from '@/components/common/CinemoNav';

export default function MyCinemaPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [counts, setCounts] = useState<UserMovieCounts | null>(null);
  const [latestScreeningDay, setLatestScreeningDay] = useState<string | null>(
    null,
  );
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarConfig = user?.avatarConfig ?? DEFAULT_AVATAR;

  const [posterPickerOpen, setPosterPickerOpen] = useState(false);
  const [selectedWallSlot, setSelectedWallSlot] = useState<number | null>(null);
  const [selectedPosters, setSelectedPosters] = useState<
    Record<number, GachaMovie>
  >({});

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [calendarAddDate, setCalendarAddDate] = useState<string | null>(null);
  const [calendarAddError, setCalendarAddError] = useState<string | null>(null);
  const [isCalendarAdding, startCalendarTransition] = useTransition();
  const [calendarDeleteTarget, setCalendarDeleteTarget] = useState<
    number | null
  >(null);
  const [calendarEditTarget, setCalendarEditTarget] = useState<{
    tmdbId: number;
    watchedAt: string;
  } | null>(null);
  const [isCalendarEditing, startCalendarEditTransition] = useTransition();

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) router.replace('/login?next=/my-cinema');
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let cancelled = false;
    async function loadCounts() {
      try {
        const res = await getUserMovieCountsRequest(token);
        if (!cancelled) setCounts(res);
      } catch {
        if (!cancelled) setCounts(null);
      }
    }
    void loadCounts();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const token = accessToken;
    let cancelled = false;

    async function loadLatestScreening() {
      try {
        const response = await listUserMoviesRequest(token, 'watched', 1, 1);
        const watchedAt = response.items[0]?.watchedAt;

        if (!cancelled) {
          setLatestScreeningDay(
            watchedAt
              ? new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Asia/Seoul',
                  month: '2-digit',
                  day: '2-digit',
                })
                  .format(new Date(watchedAt))
                  .replace('-', '.')
              : null,
          );
        }
      } catch {
        if (!cancelled) setLatestScreeningDay(null);
      }
    }

    void loadLatestScreening();

    return () => {
      cancelled = true;
    };
  }, [accessToken, calendarRefreshKey]);

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let cancelled = false;
    async function loadDisplayedPosters() {
      try {
        const response = await listDisplayedUserMoviesRequest(token);
        if (cancelled) return;
        const posters = response.items.reduce<Record<number, GachaMovie>>(
          (current, item) => {
            current[item.wallSlot] = item.movie;
            return current;
          },
          {},
        );
        setSelectedPosters(posters);
      } catch {
        if (!cancelled) setSelectedPosters({});
      }
    }
    void loadDisplayedPosters();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleSaveAvatar(config: AvatarConfig) {
    if (!accessToken || !user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAvatarRequest(accessToken, config);
      setUser(updated);
      setWardrobeOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(
    profile: UpdateProfileInput & { nickname?: string },
  ) {
    if (!accessToken || !user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfileRequest(accessToken, profile);
      setUser(updated);
      setProfileOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="my-cinema">
        <p className="my-cinema-copy my-cinema-message">
          MY CINEMA는 로그인 후 이용할 수 있어요.
        </p>
        <div className="my-cinema-actions">
          <Link href="/login" className="lobby-btn lobby-btn--primary">
            입장하기
          </Link>
          <Link href="/" className="lobby-btn">
            CINEMO LOBBY
          </Link>
        </div>
      </main>
    );
  }

  const todayLabel = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());
  const todayShortLabel = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace('-', '.');
  const currentKstYear = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    }).format(new Date()),
  );
  const showLatestScreeningDay =
    latestScreeningDay && latestScreeningDay !== todayShortLabel;
  function openPosterPicker(wallSlot: number) {
    setSelectedWallSlot(wallSlot);
    setPosterPickerOpen(true);
  }

  async function handlePosterSelected(movie: GachaMovie) {
    if (!accessToken || selectedWallSlot === null || saving) return;
    const wallSlot = selectedWallSlot;
    setSaving(true);
    setError(null);

    try {
      await updateUserMovieDisplayRequest(accessToken, {
        tmdbId: movie.id,
        kind: 'watched',
        isDisplayed: true,
        wallSlot,
      });

      setSelectedPosters((current) => ({
        ...current,
        [wallSlot]: movie,
      }));

      setPosterPickerOpen(false);
      setSelectedWallSlot(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '포스터를 저장하지 못했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePosterRemoved() {
    if (
      !accessToken ||
      selectedWallSlot === null ||
      !selectedPosters[selectedWallSlot] ||
      saving
    )
      return;

    const wallSlot = selectedWallSlot;
    const movie = selectedPosters[wallSlot];
    setSaving(true);
    setError(null);

    try {
      await updateUserMovieDisplayRequest(accessToken, {
        tmdbId: movie.id,
        kind: 'watched',
        isDisplayed: false,
        wallSlot,
      });

      setSelectedPosters((current) => {
        const next = { ...current };
        delete next[wallSlot];
        return next;
      });
      setPosterPickerOpen(false);
      setSelectedWallSlot(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '포스터를 전시 해제하지 못했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCalendarMovieSelect(movie: GachaMovie) {
    if (!calendarAddDate || !accessToken || isCalendarAdding) return;

    startCalendarTransition(async () => {
      try {
        await addWatchedMovieRequest(accessToken, movie.id, calendarAddDate);

        startCalendarTransition(() => {
          setCalendarRefreshKey((current) => current + 1);
          setCalendarAddDate(null);
        });
      } catch {
        startCalendarTransition(() => {
          setCalendarAddDate(null);
          setCalendarAddError('관람 영화 추가에 실패했어요.');
        });
      }
    });
  }

  async function handleCalendarMovieDelete(tmdbId: number) {
    if (!accessToken) return;
    try {
      await removeWatchedMovieRequest(accessToken, tmdbId);
      setCalendarRefreshKey((current) => current + 1);
    } catch {
      setCalendarAddError('관람기록 삭제에 실패했어요.');
    }
  }

  function handleCalendarMovieEdit(tmdbId: number, watchedAt: string) {
    setCalendarEditTarget({ tmdbId, watchedAt });
  }

  function handleCalendarMovieEditSave(watchedAt: string) {
    if (!calendarEditTarget || !accessToken || isCalendarEditing) return;

    startCalendarEditTransition(async () => {
      try {
        await updateWatchedAtRequest(
          accessToken,
          calendarEditTarget.tmdbId,
          watchedAt,
        );

        startCalendarEditTransition(() => {
          setCalendarRefreshKey((current) => current + 1);
          setCalendarEditTarget(null);
        });
      } catch {
        startCalendarEditTransition(() => {
          setCalendarAddError('관람일 수정에 실패했어요.');
        });
      }
    });
  }

  function logout() {
    clearSession();
    router.push('/');
  }

  return (
    <main className="my-cinema my-cinema--dashboard">
      <CinemoNav />

      <header className="my-cinema-header my-cinema-dashboard-header">
        <p className="my-cinema-kicker">MY CINEMA</p>
        <h1 className="my-cinema-title my-cinema-dashboard-brand">
          <Clapperboard size={30} strokeWidth={1.35} aria-hidden="true" />
          <span>{user.nickname}</span>
        </h1>
        <p className="my-cinema-dashboard-lede">
          내가 본 영화와 취향을 한눈에 모아보는 공간
        </p>
      </header>

      <div className="my-cinema-dashboard">
        <section className="my-cinema-profile-card" aria-label="내 프로필">
          <div className="my-cinema-profile-copy">
            <p className="my-cinema-dashboard-kicker">MY CINEMA PROFILE</p>
            <h2>{user.nickname}</h2>
            <p>오늘은 어떤 영화를 기록해볼까?</p>
          </div>

          <div className="my-cinema-profile-figure">
            <button
              type="button"
              className={`my-cinema-me-speech${user.bio?.trim() ? '' : ' my-cinema-me-speech--hint'}`}
              onClick={() => setProfileOpen(true)}
            >
              <span className="my-cinema-me-speech-text">
                {user.bio?.trim()
                  ? user.bio.trim()
                  : '프로필 작성하려면 클릭하세요'}
              </span>
            </button>
            <div className="my-cinema-me-avatar">
              <AvatarFigure config={avatarConfig} />
            </div>
          </div>

          <div className="my-cinema-profile-footer">
            {user.tags.length > 0 ? (
              <ul className="my-cinema-me-tags" aria-label="내 태그">
                {user.tags.slice(0, 5).map((tag) => (
                  <li key={tag} className="my-cinema-me-tag">
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="my-cinema-profile-empty">아직 취향 태그가 없음</p>
            )}
            <div className="my-cinema-profile-actions">
              <button type="button" onClick={() => setProfileOpen(true)}>
                프로필 수정
              </button>
              <button
                type="button"
                className="my-cinema-profile-logout"
                onClick={logout}
              >
                로그아웃
              </button>
              <button
                type="button"
                onClick={() => setWardrobeOpen(true)}
                aria-label="스타일룸 열기"
              >
                <Shirt size={17} strokeWidth={1.5} aria-hidden="true" />
                스타일룸
              </button>
            </div>
          </div>
        </section>

        <section className="my-cinema-summary-grid" aria-label="영화 기록 요약">
          <article className="my-cinema-summary-card">
            <Popcorn size={22} strokeWidth={1.4} aria-hidden />
            <span>WATCHED</span>
            <strong>{counts?.watched ?? '—'}</strong>
            <small>관람 기록</small>
          </article>
          <article className="my-cinema-summary-card">
            <Heart size={22} strokeWidth={1.4} aria-hidden />
            <span>WISHLIST</span>
            <strong>{counts?.wish ?? '—'}</strong>
            <small>보고 싶은 영화</small>
          </article>
          <button
            type="button"
            className="my-cinema-summary-card my-cinema-summary-card--calendar"
            onClick={() => setCalendarOpen(true)}
            aria-label="영화 달력 열기"
          >
            <CalendarDays size={22} strokeWidth={1.4} aria-hidden />
            <span>MOVIE CALENDAR</span>
            <strong>{todayShortLabel}</strong>
            <small>
              {showLatestScreeningDay
                ? `최근 관람 ${latestScreeningDay}`
                : todayLabel}
            </small>
            <ArrowUpRight size={17} strokeWidth={1.6} aria-hidden />
          </button>
        </section>

        <section className="my-cinema-dashboard-grid" aria-label="영화 분석">
          {accessToken ? (
            <MovieStatsPanel token={accessToken} year={currentKstYear} />
          ) : null}
          <section className="my-cinema-insight-card">
            <div>
              <p className="my-cinema-dashboard-kicker">NEXT TO EXPLORE</p>
              <h2>내 영화 취향 더 알아보기</h2>
              <p>
                관람 기록이 쌓이면 장르·플랫폼·관람 장소별 분석을 추가할 수
                있습니다.
              </p>
            </div>
            <div className="my-cinema-insight-lines" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </section>
        </section>

        <section
          className="my-cinema-wall-card"
          aria-label="영화 포스터 전시 공간"
        >
          <div className="my-cinema-section-heading">
            <div>
              <p className="my-cinema-dashboard-kicker">MY FILM WALL</p>
              <h2>영화를 걸어보세요</h2>
            </div>
            <p>MY CINEMA에 남겨두고 싶은 포스터</p>
          </div>
          <div className="my-cinema-poster-wall">
            {[1, 2, 3].map((wallSlot) => {
              const movie = selectedPosters[wallSlot];
              const posterUrl = movie?.poster_path
                ? tmdbPosterUrl(movie.poster_path, 'w342')
                : null;

              return (
                <button
                  key={wallSlot}
                  type="button"
                  disabled={saving}
                  className={`my-cinema-poster-frame${movie ? '' : ' my-cinema-poster-frame--empty'}`}
                  onClick={() => openPosterPicker(wallSlot)}
                >
                  {posterUrl ? (
                    <Image
                      className="my-cinema-selected-poster"
                      src={posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 40rem) 33vw, 20vw"
                      aria-label={`${movie.title} 포스터 교체`}
                    />
                  ) : movie ? (
                    <span>{movie.title}</span>
                  ) : (
                    <>
                      <span>
                        <Plus size={24} strokeWidth={1.35} aria-hidden />
                      </span>
                      <small>영화를 걸어보세요</small>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <nav className="my-cinema-tool-grid" aria-label="MY CINEMA 메뉴">
          <Link href="/my-cinema/watched" className="my-cinema-tool-card">
            <Popcorn size={21} strokeWidth={1.4} aria-hidden />
            <span>관람 기록</span>
            <small>본 영화 관리</small>
          </Link>
          <Link href="/my-cinema/wish" className="my-cinema-tool-card">
            <Heart size={21} strokeWidth={1.4} aria-hidden />
            <span>보고 싶은 영화</span>
            <small>다음 영화 찾기</small>
          </Link>
          <Link href="/my-cinema/postcard" className="my-cinema-tool-card">
            <Mail size={21} strokeWidth={1.4} aria-hidden />
            <span>MY POSTCARD</span>
            <small>내 엽서 보관</small>
          </Link>
          <button
            type="button"
            className="my-cinema-tool-card is-disabled"
            disabled
            title="고객센터 준비 중"
          >
            <Phone size={21} strokeWidth={1.4} aria-hidden />
            <span>고객센터</span>
            <small>준비 중</small>
          </button>
        </nav>
      </div>

      {error ? <p className="my-cinema-copy">{error}</p> : null}

      {wardrobeOpen ? (
        <WardrobeModal
          initial={avatarConfig}
          onSave={(config) => void handleSaveAvatar(config)}
          onClose={() => setWardrobeOpen(false)}
        />
      ) : null}

      {profileOpen ? (
        <ProfileModal
          initial={{
            nickname: user.nickname,
            bio: user.bio ?? '',
            profilePublic: user.profilePublic,
            tags: user.tags,
          }}
          onSave={(profile) => void handleSaveProfile(profile)}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}

      {posterPickerOpen && accessToken && selectedWallSlot !== null ? (
        <PosterPickerModal
          token={accessToken}
          onSelect={handlePosterSelected}
          onClose={() => {
            setPosterPickerOpen(false);
            setSelectedWallSlot(null);
          }}
          onRemove={
            selectedPosters[selectedWallSlot]
              ? () => void handlePosterRemoved()
              : undefined
          }
        />
      ) : null}

      {calendarAddDate && accessToken ? (
        <PosterPickerModal
          token={accessToken}
          isPending={isCalendarAdding}
          onClose={() => setCalendarAddDate(null)}
          onSelect={handleCalendarMovieSelect}
        />
      ) : null}

      {calendarOpen && accessToken ? (
        <MovieCalendarModal
          key={calendarRefreshKey}
          token={accessToken}
          onClose={() => setCalendarOpen(false)}
          onAdd={(date) => setCalendarAddDate(date)}
          onEdit={handleCalendarMovieEdit}
          onDelete={(tmdbId) => setCalendarDeleteTarget(tmdbId)}
        />
      ) : null}

      {calendarEditTarget && accessToken ? (
        <WatchedDateEditModal
          initialDate={calendarEditTarget.watchedAt.slice(0, 10)}
          isPending={isCalendarEditing}
          onClose={() => setCalendarEditTarget(null)}
          onSave={handleCalendarMovieEditSave}
        />
      ) : null}

      {calendarAddError ? (
        <ConfirmModal
          open
          title="관람 기록 처리 실패"
          description={calendarAddError}
          onClose={() => setCalendarAddError(null)}
          onConfirm={() => setCalendarAddError(null)}
          confirmLabel="닫기"
          cancelLabel=""
        />
      ) : null}
      {calendarDeleteTarget !== null ? (
        <ConfirmModal
          open
          title="관람 기록 삭제"
          description="이 관람 기록을 삭제할까요?"
          onClose={() => setCalendarDeleteTarget(null)}
          onConfirm={async () => {
            await handleCalendarMovieDelete(calendarDeleteTarget);
            setCalendarDeleteTarget(null);
          }}
          confirmLabel="삭제하기"
          tone="danger"
        />
      ) : null}
    </main>
  );
}
