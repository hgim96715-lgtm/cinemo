'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import type { MovieSearchItem, UserMovieListItem } from '@cinemo/api-contract';
import { useAuthStore } from '@/lib/auth-store';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { formatKstDateDots } from '@/lib/date-kst';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { WatchedRecordModal } from './WatchedRecordModal';
import * as PosterPickerModal from './PosterPickerModal';
import { WatchedRecordMovie } from './movie-record.types';
import { WatchedRecordSkeleton } from './WatchedRecordSkeleton';
import { MovieShelfState } from './MovieShelfState';
import { UserMovieShelfLayout } from './UserMovieShelfLayout';
import { UserMovieShelfLoginModal } from './UserMovieShelfLoginModal';
import { useUserMovieList } from '@/hooks/my-cinema/useUserMovieList';
import { useUserMovieDisplay } from '@/hooks/my-cinema/useUserMovieDisplay';

type Props = {
  title: string;
};

export function WatchedMovieShelf({ title }: Props) {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [loginPromptDismissed, setLoginPromptDismissed] = useState(false);
  const [displayLimitModalOpen, setDisplayLimitModalOpen] = useState(false);
  const [moviePickerOpen, setMoviePickerOpen] = useState(false);
  const [movieModalOpen, setMovieModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<WatchedRecordMovie | null>(
    null,
  );
  const [selectedWatchedRecord, setSelectedWatchedRecord] =
    useState<UserMovieListItem | null>(null);
  const [titleQuery, setTitleQuery] = useState('');

  const {
    items,
    loading,
    loadingMore,
    error,
    hasNext,
    loadMovies,
    loadMore,
  } = useUserMovieList({
    accessToken,
    hasUser: Boolean(user),
    kind: 'watched',
  });

  const handleDisplayLimitReached = useCallback(() => {
    setDisplayLimitModalOpen(true);
  }, []);

  const {
    displayedSlots,
    error: displayError,
    loadDisplayedSlots,
    toggleDisplay,
  } = useUserMovieDisplay({
    accessToken,
    onLimitReached: handleDisplayLimitReached,
  });

  const normalizedTitleQuery = titleQuery.trim().toLocaleLowerCase();
  const filteredItems = normalizedTitleQuery
    ? items.filter((item) =>
        item.movie.title.toLocaleLowerCase().includes(normalizedTitleQuery),
      )
    : items;
  const shelfLoading = !hydrated || (Boolean(accessToken) && loading);
  const loginModalOpen = hydrated && !accessToken && !loginPromptDismissed;
  const shelfError = error ?? displayError;

  function handleMovieSelect(movie: MovieSearchItem) {
    setSelectedMovie(movie);
    setSelectedWatchedRecord(null);
    setMoviePickerOpen(false);
    setMovieModalOpen(true);
  }

  return (
    <>
      <UserMovieShelfLoginModal
        open={loginModalOpen}
        onClose={() => setLoginPromptDismissed(true)}
      />

      <ConfirmModal
        open={displayLimitModalOpen}
        eyebrow="HOME TICKET"
        title="홈 티켓이 가득 찼어요"
        description="홈 티켓은 최대 3편까지 표시할 수 있어요."
        confirmLabel="확인"
        onConfirm={() => setDisplayLimitModalOpen(false)}
        onClose={() => setDisplayLimitModalOpen(false)}
      />

      <UserMovieShelfLayout kind="watched" title={title}>
        <div className="my-cinema-shelf-toolbar">
          <div className="my-cinema-shelf-search">
            <span className="sr-only">영화 제목 검색</span>
            <input
              type="text"
              value={titleQuery}
              onChange={(event) => setTitleQuery(event.target.value)}
              placeholder="영화 제목 검색"
              aria-label="영화 제목 검색"
            />
            {titleQuery ? (
              <button
                type="button"
                className="cinemo-icon-action my-cinema-shelf-search-clear"
                onClick={() => setTitleQuery('')}
                aria-label="검색어 지우기"
              >
                <X size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="my-cinema-shelf-add"
            onClick={() => setMoviePickerOpen(true)}
            disabled={!accessToken}
          >
            <Plus size={15} strokeWidth={1.7} aria-hidden="true" />
            관람 기록 추가
          </button>
        </div>

        <MovieShelfState
          loading={shelfLoading}
          skeleton={<WatchedRecordSkeleton />}
          error={shelfError}
          isEmpty={filteredItems.length === 0}
          emptyLabel={titleQuery.trim() ? '검색 결과가 없어요.' : '본 작품이 없어요.'}
        >
          <ul className="my-cinema-movie-grid my-cinema-movie-grid--watched">
            {filteredItems.map((item) => {
              const movie = item.movie;
              const poster = tmdbPosterUrl(movie.poster_path, 'w342');

              return (
                <li
                  key={`${item.tmdbId}-${item.updatedAt}`}
                  className="my-cinema-movie my-cinema-movie--watched"
                >
                  <button
                    type="button"
                    className="my-cinema-movie-card-wrap"
                    aria-label={`${movie.title} 상세 보기`}
                    onClick={() => {
                      setSelectedMovie(movie);
                      setSelectedWatchedRecord(item);
                      setMovieModalOpen(true);
                    }}
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
                      <div className="my-cinema-movie-meta">
                        <span className="my-cinema-watched-kicker">CINEMO · WATCHED</span>
                        <span className="my-cinema-movie-title">{movie.title}</span>

                        <div className="my-cinema-watched-details">
                          <div className="my-cinema-watched-meta">
                            <span className="my-cinema-watched-date">
                              <small>DATE</small>
                              <strong>
                                {item.watchedAt
                                  ? formatKstDateDots(item.watchedAt)
                                  : '—'}
                              </strong>
                            </span>
                            <span className="my-cinema-watched-location">
                              <small>LOCATION</small>
                              <strong title={item.viewingPlace ?? undefined}>
                                {item.viewingPlace || '—'}
                              </strong>
                            </span>
                          </div>

                          <span
                            className={`my-cinema-watched-rating${
                              item.rating == null ? ' is-empty' : ''
                            }`}
                          >
                            {item.rating == null ? '평점 없음' : `${item.rating}/10`}
                          </span>

                          <p className="my-cinema-watched-review">
                            {item.review?.trim()
                              ? `“${item.review.trim()}”`
                              : '아직 후기를 남기지 않았어요.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {hasNext && (!titleQuery.trim() || filteredItems.length > 1) ? (
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

      {selectedMovie ? (
        <WatchedRecordModal
          open={movieModalOpen}
          movie={selectedMovie}
          watchedRecord={selectedWatchedRecord ?? undefined}
          isDisplayed={selectedMovie.id in displayedSlots}
            onToggleDisplay={() => {
              void toggleDisplay(selectedMovie.id);
          }}
          onClose={() => {
            setMovieModalOpen(false);
            setSelectedMovie(null);
            setSelectedWatchedRecord(null);
          }}
          onSaved={() => {
            setMovieModalOpen(false);
            setSelectedMovie(null);
            setSelectedWatchedRecord(null);
            void Promise.all([loadMovies(), loadDisplayedSlots()]);
          }}
        />
      ) : null}

      {moviePickerOpen && accessToken ? (
        <PosterPickerModal.PosterPickerModal
          token={accessToken}
          onSelect={handleMovieSelect}
          onClose={() => setMoviePickerOpen(false)}
        />
      ) : null}
    </>
  );
}
