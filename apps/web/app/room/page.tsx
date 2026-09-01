'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_AVATAR,
  type GachaMovie,
  type AvatarConfig,
  type UserMovieCounts,
} from '@cinemo/shared';
import { useAuthStore, type UpdateProfileInput } from '@/lib/auth-store';
import { updateAvatarRequest, updateProfileRequest } from '@/lib/auth-api';
import { AvatarFigure } from '@/components/room/AvatarFigure';
import { WardrobeModal } from '@/components/room/WardrobeModal';
import { ProfileModal } from '@/components/room/ProfileModal';
import {
  getUserMovieCountsRequest,
  listDisplayedUserMoviesRequest,
  updateUserMovieDisplayRequest,
} from '@/lib/user-movie-api';
import '../styles/room.css';
import '../styles/lobby.css';
import '../styles/avatar.css';
import '../styles/profile.css';
import {
  CalendarDays,
  Clapperboard,
  Film,
  Heart,
  NotebookPen,
  Phone,
  Plus,
  Shirt,
} from 'lucide-react';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { PosterPickerModal } from '@/components/room/PosterPickerModal';

export default function MyRoomPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [counts, setCounts] = useState<UserMovieCounts | null>(null);
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

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) router.replace('/login?next=/room');
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
      <main className="room">
        <p className="room-copy">내 방은 입장 후 이용할 수 있어요.</p>
        <div className="room-actions">
          <Link href="/login" className="lobby-btn lobby-btn--primary">
            입장하기
          </Link>
          <Link href="/" className="lobby-btn">
            로비로
          </Link>
        </div>
      </main>
    );
  }

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

  function logout() {
    clearSession();
    router.push('/');
  }

  return (
    <main className="room">
      <header className="room-header">
        <p className="room-kicker">MY ROOM</p>
        <h1 className="room-title">{user.nickname}방</h1>
      </header>

      <div className="room-stage">
        <div className="room-scene" aria-label="내 방">
          <div className="room-scene-wall" aria-hidden />
          <div className="room-scene-floor" aria-hidden />

          <div className="room-poster-wall" aria-label="영화 포스터 전시 공간">
            {[1, 2, 3].map((wallSlot) => {
              const movie = selectedPosters[wallSlot];

              return (
                <button
                  key={wallSlot}
                  type="button"
                  disabled={saving}
                  className={`room-poster-frame${movie ? '' : ' room-poster-frame--empty'}`}
                  onClick={() => openPosterPicker(wallSlot)}
                >
                  {movie?.poster_path ? (
                    <img
                      className="room-selected-poster"
                      src={
                        tmdbPosterUrl(movie.poster_path, 'w342') ?? undefined
                      }
                      aria-label={
                        movie
                          ? `${movie.title} 포스터 교체`
                          : `${wallSlot}번 포스터 걸기`
                      }
                      alt={movie.title}
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

          <div className="room-feature-board room-feature-board--calendar">
            <span className="room-feature-board-icon" aria-hidden>
              <CalendarDays size={22} strokeWidth={1.35} />
            </span>
            <span className="room-feature-board-copy">
              <small>MY SCREENINGS</small>
              <strong>관람일</strong>
              <span className="room-feature-board-days" aria-hidden>
                <i>03</i>
                <i>12</i>
                <i>27</i>
              </span>
            </span>
          </div>

          <div className="room-feature-board room-feature-board--whiteboard">
            <span className="room-feature-board-icon" aria-hidden>
              <NotebookPen size={22} strokeWidth={1.35} />
            </span>
            <span className="room-feature-board-copy">
              <small>QUOTE BOARD</small>
              <strong>명대사 화이트보드</strong>
              <span className="room-feature-board-lines" aria-hidden>
                <i />
                <i />
              </span>
            </span>
          </div>

          <Link
            href="/room/watched"
            className="room-object room-object--collection room-object--watched"
            aria-label={`관람 기록`}
          >
            <span className="room-collection-icon" aria-hidden>
              <Clapperboard size={26} strokeWidth={1.35} />
            </span>
            <span className="room-object-label">관람 기록</span>
            {/* <span className="room-object-count">{counts?.watched ?? 0}편</span> */}
          </Link>

          <Link
            href="/room/wish"
            className="room-object room-object--collection room-object--wish"
            aria-label={`보고 싶은 영화`}
          >
            <span className="room-collection-icon" aria-hidden>
              <Heart size={26} strokeWidth={1.35} />
            </span>
            <span className="room-object-label">보고 싶은 영화</span>
            {/* <span className="room-object-count">{counts?.wish ?? 0}편</span> */}
          </Link>

          <Link
            href="/room/quotes"
            className="room-object room-object--collection room-object--quotes"
            aria-label="명대사 모음집"
          >
            <span className="room-collection-icon" aria-hidden>
              <Film size={26} strokeWidth={1.35} />
            </span>
            <span className="room-object-label">명대사 모음집</span>
          </Link>

          <button
            type="button"
            className="room-object room-object--collection room-object--wardrobe"
            onClick={() => setWardrobeOpen(true)}
            disabled={saving}
            aria-label="스타일룸 열기"
          >
            <span className="room-collection-icon" aria-hidden>
              <Shirt size={26} strokeWidth={1.35} />
            </span>
            <span className="room-object-label">스타일룸</span>
          </button>

          <button
            type="button"
            className="room-object room-object--phone"
            disabled
            title="고객센터 준비 중"
            aria-label="고객센터, 준비 중"
          >
            <span className="room-phone-icon" aria-hidden>
              <Phone size={28} strokeWidth={1.35} />
            </span>
            <span className="room-object-label">고객센터</span>
          </button>

          <div className="room-me">
            <button
              type="button"
              className={`room-me-speech${user.bio?.trim() ? '' : ' room-me-speech--hint'}`}
              onClick={() => setProfileOpen(true)}
            >
              <span className="room-me-speech-text">
                {user.bio?.trim()
                  ? user.bio.trim()
                  : '프로필 작성하려면 클릭하세요'}
              </span>
            </button>
            <div className="room-me-avatar">
              <AvatarFigure config={avatarConfig} />
            </div>
            <p className="room-me-name">{user.nickname}</p>
            {user.tags.length > 0 ? (
              <ul className="room-me-tags" aria-label="내 태그">
                {user.tags.slice(0, 3).map((tag) => (
                  <li key={tag} className="room-me-tag">
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="room-copy">{error}</p> : null}

      <div className="room-actions">
        <Link href="/" className="lobby-btn lobby-btn--primary">
          로비로
        </Link>
        <button type="button" className="lobby-btn" onClick={logout}>
          로그아웃
        </button>
      </div>

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
    </main>
  );
}
