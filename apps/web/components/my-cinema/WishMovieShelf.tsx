'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import type {
  UserMovieListItem,
  WishMovieDetailResponse,
} from '@cinemo/api-contract';
import { useAuthStore } from '@/lib/auth-store';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import {
  getMovieReleaseNotificationRequest,
  getWishMovieDetailRequest,
  toggleUserMovieRequest,
  updateMovieReleaseNotificationRequest,
} from '@/lib/user-movie-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { MovieDetailModal } from './MovieDetailModal';
import { MovieShelfState } from './MovieShelfState';
import { UserMovieShelfLayout } from './UserMovieShelfLayout';
import { UserMovieShelfLoginModal } from './UserMovieShelfLoginModal';
import { WatchedRecordModal } from './WatchedRecordModal';
import type { WatchedRecordMovie } from './movie-record.types';
import { WishMovieSkeleton } from './WishMovieSkeleton';
import { useUserMovieList } from '@/hooks/my-cinema/useUserMovieList';
import { useUserMovieDisplay } from '@/hooks/my-cinema/useUserMovieDisplay';

type Props = {
  title: string;
};

type WishMovieModalMovie = UserMovieListItem['movie'] &
  Partial<WishMovieDetailResponse>;

export function WishMovieShelf({ title }: Props) {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [loginPromptDismissed, setLoginPromptDismissed] = useState(false);
  const [wishDetailMovie, setWishDetailMovie] =
    useState<WishMovieModalMovie | null>(null);
  const [isWishDetailLoading, setIsWishDetailLoading] = useState(false);
  const [wishReleaseNotificationEnabled, setWishReleaseNotificationEnabled] =
    useState(false);
  const wishDetailRequestIdRef = useRef(0);
  const [watchedModalMovie, setWatchedModalMovie] =
    useState<WatchedRecordMovie | null>(null);
  const [displayLimitModalOpen, setDisplayLimitModalOpen] = useState(false);

  const { items, loading, loadingMore, error, hasNext, loadMovies, loadMore } =
    useUserMovieList({
    accessToken,
    hasUser: Boolean(user),
      kind: 'wish',
    });

  const handleDisplayLimitReached = useCallback(() => {
    setDisplayLimitModalOpen(true);
  }, []);

  const { displayedSlots, toggleDisplay } = useUserMovieDisplay({
    accessToken,
    onLimitReached: handleDisplayLimitReached,
  });

  const shelfLoading = !hydrated || (Boolean(accessToken) && loading);
  const loginModalOpen = hydrated && !accessToken && !loginPromptDismissed;

  async function handleWishMovieClick(item: UserMovieListItem) {
    const requestId = wishDetailRequestIdRef.current + 1;
    wishDetailRequestIdRef.current = requestId;
    setWishDetailMovie(item.movie);
    setWishReleaseNotificationEnabled(false);
    setIsWishDetailLoading(Boolean(accessToken));

    if (!accessToken) {
      return;
    }

    const notificationPromise = getMovieReleaseNotificationRequest(
      accessToken,
      item.tmdbId,
    ).catch(() => null);

    void notificationPromise.then((notification) => {
      if (wishDetailRequestIdRef.current !== requestId) return;
      setWishReleaseNotificationEnabled(notification?.enabled ?? false);
    });

    try {
      const detail = await getWishMovieDetailRequest(accessToken, item.tmdbId);

      if (wishDetailRequestIdRef.current !== requestId) return;

      setWishDetailMovie((current) =>
        current ? { ...current, ...detail } : current,
      );
    } catch {
      // 상세 조회가 실패해도 목록에서 받은 기본 영화 정보로 모달을 표시함
    } finally {
      if (wishDetailRequestIdRef.current === requestId) {
        setIsWishDetailLoading(false);
      }
    }
  }

  async function handleWishToggle(tmdbId: number) {
    if (!accessToken) {
      return;
    }

    // 영화가 목록에서 사라지는 동작이므로 모달은 API 응답을 기다리지 않고 닫음
    setWishDetailMovie(null);

    try {
      await toggleUserMovieRequest(accessToken, tmdbId, 'wish');
    } catch {
      // 실패해도 현재 서버 목록을 다시 받아 화면 상태를 복구함
    } finally {
      await loadMovies();
    }
  }

  async function handleWishReleaseNotificationToggle() {
    if (!accessToken || !wishDetailMovie) {
      return;
    }

    const enabled = !wishReleaseNotificationEnabled;
    const previousEnabled = wishReleaseNotificationEnabled;

    // 버튼 상태는 즉시 바꾸고, 실패할 때만 이전 상태로 되돌림
    setWishReleaseNotificationEnabled(enabled);

    try {
      await updateMovieReleaseNotificationRequest(
        accessToken,
        wishDetailMovie.id,
        enabled,
        wishDetailMovie.release_date,
      );
    } catch {
      setWishReleaseNotificationEnabled(previousEnabled);
    }
  }

  return (
    <>
      <ConfirmModal
        open={displayLimitModalOpen}
        eyebrow="HOME TICKET"
        title="홈 티켓이 가득 찼어요"
        description="홈 티켓은 최대 3편까지 표시할 수 있어요."
        confirmLabel="확인"
        onConfirm={() => setDisplayLimitModalOpen(false)}
        onClose={() => setDisplayLimitModalOpen(false)}
      />

      <UserMovieShelfLoginModal
        open={loginModalOpen}
        onClose={() => setLoginPromptDismissed(true)}
      />

      <UserMovieShelfLayout kind="wish" title={title}>
        <MovieShelfState
          loading={shelfLoading}
          skeleton={<WishMovieSkeleton />}
          error={error}
          isEmpty={items.length === 0}
          emptyLabel="찜한 영화가 없어요."
        >
          <ul className="my-cinema-movie-grid my-cinema-movie-grid--wish">
            {items.map((item) => {
              const movie = item.movie;
              const poster = tmdbPosterUrl(movie.poster_path, 'w342');

              return (
                <li key={`${item.tmdbId}-${item.updatedAt}`} className="my-cinema-movie">
                  <button
                    type="button"
                    className="my-cinema-movie-card-wrap"
                    aria-label={`${movie.title} 상세 보기`}
                    onClick={() => void handleWishMovieClick(item)}
                  >
                    <div className="my-cinema-movie-poster">
                      {poster ? (
                        <Image
                          src={poster}
                          alt={`${movie.title} 포스터`}
                          fill
                          sizes="(max-width: 720px) 42vw, (max-width: 1100px) 24vw, 180px"
                        />
                      ) : (
                        <span className="my-cinema-movie-poster-empty">No Poster</span>
                      )}
                    </div>

                    <div className="my-cinema-movie-info">
                      <div className="my-cinema-wish-info">
                        <div className="my-cinema-wish-kicker-row">
                          <span className="my-cinema-wish-kicker">CINEMO · WISH</span>
                          <span className="my-cinema-movie-facts">
                            개봉{' '}
                            {movie.release_date
                              ? movie.release_date.replaceAll('-', '.')
                              : '개봉일 미정'}
                          </span>
                        </div>
                        <div className="my-cinema-wish-title-row">
                          <span className="my-cinema-movie-title">{movie.title}</span>
                          <span
                            className="my-cinema-wish-heart"
                            aria-label="보고 싶은 영화"
                          >
                            <Heart
                              size={16}
                              strokeWidth={1.8}
                              fill="currentColor"
                              aria-hidden
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {hasNext ? (
            <button
              type="button"
              className="my-cinema-shelf-more"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? '불러오는 중…' : '더 보기'}
            </button>
          ) : null}
        </MovieShelfState>
      </UserMovieShelfLayout>

      {wishDetailMovie ? (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) {
              setWishDetailMovie(null);
              setIsWishDetailLoading(false);
            }
          }}
        >
          <MovieDetailModal
            movie={wishDetailMovie}
            isDetailLoading={isWishDetailLoading}
            movieStatus={{ wish: true, watched: false }}
            showWatchedMark
            showCalendar={false}
            releaseNotificationEnabled={wishReleaseNotificationEnabled}
            onToggleReleaseNotification={() => {
              void handleWishReleaseNotificationToggle();
            }}
            onToggleMark={(kind) => {
              if (kind === 'wish') {
                void handleWishToggle(wishDetailMovie.id);
                return;
              }

              if (kind === 'watched') {
                setWishDetailMovie(null);
                setWatchedModalMovie(wishDetailMovie);
              }
            }}
            onClose={() => setWishDetailMovie(null)}
          />
        </Dialog.Root>
      ) : null}

      {watchedModalMovie ? (
        <WatchedRecordModal
          open
          movie={watchedModalMovie}
          isDisplayed={watchedModalMovie.id in displayedSlots}
          onToggleDisplay={() => {
            void toggleDisplay(watchedModalMovie.id);
          }}
          onClose={() => setWatchedModalMovie(null)}
          onSaved={() => {
            setWatchedModalMovie(null);
            void loadMovies();
          }}
        />
      ) : null}
    </>
  );
}
