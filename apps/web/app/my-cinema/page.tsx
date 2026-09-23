'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  Film,
  Heart,
  Images,
  LifeBuoy,
  LibraryBig,
  LogOut,
  PencilLine,
  Settings,
} from 'lucide-react';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';
import { ProfileModal } from '@/components/my-cinema/ProfileModal';
import { updateProfileRequest } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import '@/styles/my-cinema.css';
import '@/styles/lobby.css';
import '@/styles/common.css';
import '@/styles/cinemo-nav.css';
import '@/styles/cinemo-page-header.css';

export default function MyCinemaPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setUser = useAuthStore((s) => s.setUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [ticketDate, setTicketDate] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTicketDate(
        new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date()),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace('/login?next=/my-cinema');
    }
  }, [hydrated, accessToken, router]);

  function handleLogout() {
    clearSession();
    router.replace('/');
  }

  if (!hydrated || !accessToken) {
    return null;
  }

  return (
    <main className="my-cinema my-cinema--dashboard">
      <CinemoPageHeader
        className="my-cinema-dashboard-header"
        eyebrow="MY CINEMA"
        title="나의 영화 공간"
        description="좋아하는 영화를 한곳에서 관리하는 개인 공간"
        titleClassName="my-cinema-title"
        descriptionClassName="my-cinema-dashboard-lede"
        leading={
          <div className="my-cinema-dashboard-brand">
            <LibraryBig size={16} strokeWidth={1.8} aria-hidden="true" />
          </div>
        }
      />

      <div className="my-cinema-dashboard">
        <section
          className="my-cinema-profile-card"
          aria-labelledby="profile-heading"
        >
          <div className="my-cinema-profile-main">
            <div className="my-cinema-profile-copy">
              <div className="my-cinema-profile-heading-row">
                <p className="my-cinema-dashboard-kicker">PROFILE</p>
                <div className="my-cinema-profile-heading-actions">
                  <button
                    className="my-cinema-profile-edit"
                    type="button"
                    onClick={() => setProfileOpen(true)}
                  >
                    <PencilLine size={13} aria-hidden="true" />
                    수정
                  </button>
                  <button
                    className="my-cinema-profile-logout"
                    type="button"
                    onClick={handleLogout}
                  >
                    <LogOut size={13} aria-hidden="true" />
                    로그아웃
                  </button>
                </div>
              </div>
              <h2 id="profile-heading">{user?.nickname ?? '영화 기록자'}</h2>
              <p className="my-cinema-profile-bio">
                {user?.bio?.trim() || '나만의 취향과 영화 기록을 쌓아가는 중'}
              </p>
            </div>

            <div className="my-cinema-profile-footer">
              <span className="my-cinema-profile-visibility">
                <small>PROFILE</small>
                {user?.profilePublic ? 'PUBLIC' : 'PRIVATE'}
              </span>
              <div className="my-cinema-profile-tags" aria-label="프로필 태그">
                {user?.tags?.length ? (
                  user.tags
                    .slice(0, 5)
                    .map((tag) => <span key={tag}>#{tag}</span>)
                ) : (
                  <span className="is-empty">태그를 아직 정하지 않았어요</span>
                )}
              </div>
            </div>
          </div>

          <div className="my-cinema-profile-stub" aria-label="티켓 정보">
            <span className="my-cinema-profile-stub-label">MY CINEMA</span>
            <span className="my-cinema-profile-date">
              {ticketDate || '----.--.--'}
            </span>
            <span className="my-cinema-profile-barcode" aria-hidden="true" />
          </div>
        </section>

        <section
          className="my-cinema-wall-card"
          aria-labelledby="collection-heading"
        >
          <div className="my-cinema-section-heading">
            <div>
              <p className="my-cinema-dashboard-kicker">COLLECTION</p>
              <h2 id="collection-heading">개인 컬렉션</h2>
            </div>
            <p>나의 영화 활동</p>
          </div>

          <div className="my-cinema-tool-grid">
            <Link className="my-cinema-tool-card" href="/my-cinema/watched">
              <Film size={18} aria-hidden="true" />
              <span>관람 기록</span>
              <small>본 영화 모아보기</small>
            </Link>
            <Link className="my-cinema-tool-card" href="/my-cinema/wish">
              <Heart size={18} aria-hidden="true" />
              <span>보고 싶은 영화</span>
              <small>관심 영화 모아보기</small>
            </Link>
            <Link className="my-cinema-tool-card" href="/my-cinema/postcard">
              <Images size={18} aria-hidden="true" />
              <span>MY POSTCARD</span>
              <small>영화 문장 기록</small>
            </Link>
            <div
              className="my-cinema-tool-card is-disabled"
              aria-disabled="true"
            >
              <CalendarDays size={18} aria-hidden="true" />
              <span>영화 캘린더</span>
              <small>관람 일정 연결 예정</small>
            </div>
          </div>
        </section>

        <section
          className="my-cinema-wall-card"
          aria-labelledby="insights-heading"
        >
          <div className="my-cinema-section-heading">
            <div>
              <p className="my-cinema-dashboard-kicker">INSIGHTS</p>
              <h2 id="insights-heading">나의 영화 통계</h2>
            </div>
            <p>취향 분석</p>
          </div>

          <div className="my-cinema-tool-grid">
            <div
              className="my-cinema-tool-card is-disabled"
              aria-disabled="true"
            >
              <BarChart3 size={18} aria-hidden="true" />
              <span>월별 관람 기록</span>
              <small>언제 영화를 많이 봤는지</small>
            </div>
            <div
              className="my-cinema-tool-card is-disabled"
              aria-disabled="true"
            >
              <Film size={18} aria-hidden="true" />
              <span>감독·장르 분석</span>
              <small>좋아하는 영화 취향 분석</small>
            </div>
          </div>
        </section>

        <section
          className="my-cinema-wall-card"
          aria-labelledby="support-heading"
        >
          <div className="my-cinema-section-heading">
            <div>
              <p className="my-cinema-dashboard-kicker">MORE</p>
              <h2 id="support-heading">설정 및 도움말</h2>
            </div>
          </div>

          <div className="my-cinema-tool-grid">
            <div
              className="my-cinema-tool-card is-disabled"
              aria-disabled="true"
            >
              <Settings size={18} aria-hidden="true" />
              <span>설정</span>
              <small>계정·공개 범위 관리</small>
            </div>
            <div
              className="my-cinema-tool-card is-disabled"
              aria-disabled="true"
            >
              <LifeBuoy size={18} aria-hidden="true" />
              <span>고객센터</span>
              <small>서비스 이용 도움말</small>
            </div>
          </div>
        </section>
      </div>

      {profileOpen && accessToken && user ? (
        <ProfileModal
          initial={{
            nickname: user.nickname,
            bio: user.bio ?? '',
            profilePublic: user.profilePublic,
            tags: user.tags,
          }}
          onSave={async (input) => {
            const updatedUser = await updateProfileRequest(accessToken, input);
            setUser(updatedUser);
            setProfileOpen(false);
          }}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
    </main>
  );
}
