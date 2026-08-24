'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_AVATAR,
  type AvatarConfig,
  type UserMovieCounts,
} from '@cinemo/shared';
import { useAuthStore, type UpdateProfileInput } from '@/lib/auth-store';
import { updateAvatarRequest, updateProfileRequest } from '@/lib/auth-api';
import { AvatarFigure } from '@/components/room/AvatarFigure';
import { WardrobeModal } from '@/components/room/WardrobeModal';
import { ProfileModal } from '@/components/room/ProfileModal';
import { getUserMovieCountsRequest } from '@/lib/user-movie-api';
import '../styles/room.css';
import '../styles/lobby.css';
import '../styles/avatar.css';
import '../styles/profile.css';

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

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) router.replace('/login?next=/room');
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    async function loadCounts() {
      try {
        const res = await getUserMovieCountsRequest(accessToken!);
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

  async function handleSaveAvatar(config: AvatarConfig) {
    if (!accessToken || !user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAvatarRequest(accessToken, config);
      setUser(updated);
      setWardrobeOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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

  function logout() {
    clearSession();
    router.push('/');
  }

  return (
    <main className="room">
      <header className="room-header">
        <p className="room-kicker">MY ROOM</p>
        <h1 className="room-title">{user.nickname}의 방</h1>
      </header>

      <div className="room-stage">
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

        <nav className="room-doors" aria-label="영화 선반">
          <Link href="/room/wish" className="room-door">
            <span className="room-door-label">찜 선반</span>
            <span className="room-door-count">{counts?.wish ?? '—'}</span>
          </Link>
          <Link href="/room/watched" className="room-door">
            <span className="room-door-label">봤어요 선반</span>
            <span className="room-door-count">{counts?.watched ?? '—'}</span>
          </Link>
        </nav>

        <nav className="room-zones" aria-label="내 방 구역">
          <button
            type="button"
            className="room-zone"
            onClick={() => setWardrobeOpen(true)}
            disabled={saving}
          >
            옷방
          </button>
          <button type="button" className="room-zone" disabled title="준비 중">
            고객센터
          </button>
        </nav>
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
    </main>
  );
}
