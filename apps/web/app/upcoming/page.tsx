'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Sparkles } from 'lucide-react';
import {
  getUpcomingMoviesRequest,
  type UpcomingMovie,
} from '@/lib/lobby-board-api';
import {
  getMovieReleaseNotificationRequest,
  listUserMoviesRequest,
  toggleUserMovieRequest,
  updateMovieReleaseNotificationRequest,
} from '@/lib/user-movie-api';
import { useAuthStore } from '@/lib/auth-store';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import '@/styles/lobby.css';
import '@/styles/upcoming.css';
import '@/styles/my-cinema.css';
import '@/styles/movie-detail-modal.css';
import '@/styles/moviechart-modal.css';
import '@/styles/confirm-modal.css';
import '@/styles/common.css';

import { MovieCard } from '@cinemo/shared';
import { getMovieDetailRequest } from '@/lib/tmdb-api';
import { MovieDetailModal } from '@/components/my-cinema/MovieDetailModal';
import { MovieDetailModalSkeleton } from '@/components/my-cinema/MovieDetailModalSkeleton';
import { CinemoNav } from '@/components/common/CinemoNav';
import { UpcomingMovieListSkeleton } from '@/components/upcoming/UpcomingMovieListSkeleton';
import { kstDateKey, kstYearMonth } from '@/lib/date-kst';

type UpcomingPeriod = {
  key: string;
  label: string;
};

function getUpcomingPeriods(): UpcomingPeriod[] {
  const { year, month } = kstYearMonth();
  const currentMonth = new Date(Date.UTC(year, month - 1, 1));

  const monthPeriods = [0, 1, 2, 3].map((offset) => {
    const date = new Date(
      Date.UTC(year, currentMonth.getUTCMonth() + offset, 1),
    );
    const monthNumber = date.getUTCMonth() + 1;

    return {
      key: `${date.getUTCFullYear()}-${String(monthNumber).padStart(2, '0')}`,
      label: `${monthNumber}월`,
    };
  });

  return [
    { key: 'all', label: '전체' },
    ...monthPeriods,
    ...(month === 12
      ? [{ key: String(year + 1), label: `${year + 1}년` }]
      : []),
  ];
}

function UpcomingPageContent() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [movies, setMovies] = useState<UpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingInterestId, setTogglingInterestId] = useState<number | null>(
    null,
  );
  const [interestedIds, setInterestedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const periods = getUpcomingPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [detailMovie, setDetailMovie] = useState<MovieCard | null>(null);
  const [detailMovieId, setDetailMovieId] = useState<number | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  const [releaseNotificationById, setReleaseNotificationById] = useState<
    Record<number, boolean>
  >({});

  const searchParams = useSearchParams();

  useEffect(() => {
    const month = searchParams.get('month');

    setSelectedPeriod(
      month && periods.some((period) => period.key === month) ? month : 'all',
    );
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadUpcomingMovies() {
      const period = selectedPeriod;
      if (period === null) return;

      setLoading(true);
      setError(null);
      setPage(1);

      try {
        const result = await getUpcomingMoviesRequest(
          period === 'all' ? undefined : period,
          1,
          10,
        );

        if (!cancelled) {
          setMovies(result.items);
          setHasNext(result.hasNext);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '개봉 예정작을 불러오지 못했어요.',
          );
          setMovies([]);
          setHasNext(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUpcomingMovies();

    return () => {
      cancelled = true;
    };
  }, [selectedPeriod]);

  async function handleLoadMore() {
    if (loadingMore || !hasNext || selectedPeriod === null) return;

    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await getUpcomingMoviesRequest(
        selectedPeriod === 'all' ? undefined : selectedPeriod,
        nextPage,
        10,
      );

      setMovies((current) => [...current, ...result.items]);
      setPage(nextPage);
      setHasNext(result.hasNext);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const token = accessToken;
    let cancelled = false;

    async function loadInterestedMovies() {
      if (!token) {
        if (!cancelled) {
          setInterestedIds([]);
        }
        return;
      }

      try {
        const result = await listUserMoviesRequest(token, 'wish', 1, 100);
        if (!cancelled) {
          setInterestedIds(result.items.map((movie) => movie.tmdbId));
        }
      } catch {
        if (!cancelled) {
          setInterestedIds([]);
        }
      }
    }
    void loadInterestedMovies();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleInterestClick(tmdbId: number) {
    if (!accessToken) {
      router.push('/login?next=/upcoming');
      return;
    }
    setTogglingInterestId(tmdbId);
    try {
      const result = await toggleUserMovieRequest(accessToken, tmdbId, 'wish');
      setInterestedIds((current) =>
        result.active
          ? [...current, tmdbId]
          : current.filter((id) => id !== tmdbId),
      );
      setMovies((current) =>
        current.map((movie) =>
          movie.tmdbId === tmdbId
            ? {
                ...movie,
                interestCount: Math.max(
                  0,
                  movie.interestCount + (result.active ? 1 : -1),
                ),
              }
            : movie,
        ),
      );
    } finally {
      setTogglingInterestId(null);
    }
  }

  function isTodayKst(releaseDate: string) {
    return releaseDate === kstDateKey();
  }

  function getReleaseDateDisplay(
    releaseDate: string,
    originalReleaseDate?: string | null,
  ) {
    const today = kstDateKey();
    const currentDate = releaseDate.replaceAll('-', '.');
    const originalTime = originalReleaseDate
      ? Date.parse(`${originalReleaseDate}T00:00:00Z`)
      : NaN;
    const releaseTime = Date.parse(`${releaseDate}T00:00:00Z`);
    const isLikelyReRelease =
      Number.isFinite(originalTime) &&
      Number.isFinite(releaseTime) &&
      releaseTime - originalTime >= 365 * 24 * 60 * 60 * 1000;

    if (releaseDate === today) {
      if (isLikelyReRelease && originalReleaseDate) {
        return {
          primary: '오늘 개봉 (재개봉)',
          secondary: `원개봉 ${originalReleaseDate.replaceAll('-', '.')}`,
        };
      }

      return { primary: '오늘 개봉', secondary: null };
    }

    if (isLikelyReRelease && originalReleaseDate) {
      return {
        primary: `${currentDate} 재개봉`,
        secondary: `원개봉 ${originalReleaseDate.replaceAll('-', '.')}`,
      };
    }

    return { primary: `${currentDate} 개봉 예정`, secondary: null };
  }

  function handlePeriodChange(period: string) {
    setSelectedPeriod(period);

    const params = new URLSearchParams(searchParams.toString());

    if (period === 'all') {
      params.delete('month');
    } else {
      params.set('month', period);
    }

    const query = params.toString();

    router.replace(query ? `/upcoming?${query}` : '/upcoming');
  }

  async function handleDetailClick(tmdbId: number) {
    setDetailMovieId(tmdbId);
    setDetailMovie(null);
    setLoadingDetailId(tmdbId);

    const upcomingMovie = movies.find((item) => item.tmdbId === tmdbId);

    const notificationPromise = accessToken
      ? (async () => {
          try {
            return await getMovieReleaseNotificationRequest(
              accessToken,
              tmdbId,
            );
          } catch {
            return null;
          }
        })()
      : null;

    try {
      const movie = await getMovieDetailRequest(tmdbId);

      setDetailMovie({
        ...movie,
        release_date: upcomingMovie?.releaseDate ?? movie.release_date,
      });

      if (notificationPromise) {
        void (async () => {
          const notification = await notificationPromise;

          setReleaseNotificationById((current) => ({
            ...current,
            [tmdbId]: notification?.enabled ?? false,
          }));
        })();
      }
    } finally {
      setLoadingDetailId(null);
    }
  }

  async function handleReleaseNotificationToggle() {
    if (!detailMovie) return;

    if (!accessToken) {
      router.push('/login?next=/upcoming');
      return;
    }

    const tmdbId = detailMovie.id;
    const enabled = !(releaseNotificationById[tmdbId] ?? false);

    try {
      await updateMovieReleaseNotificationRequest(
        accessToken,
        tmdbId,
        enabled,
        detailMovie.release_date,
      );

      setReleaseNotificationById((current) => ({
        ...current,
        [tmdbId]: enabled,
      }));
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : '개봉일 알림 설정에 실패했어요.',
      );
    }
  }

  return (
    <main className="lobby upcoming-lobby lobby--lit">
      <section className="lobby-stage upcoming-page">
        <CinemoNav
          rightHref="/my-cinema/wish"
          rightLabel="찜한 영화"
          rightAriaLabel="찜한 영화로 이동"
        />

        <header className="upcoming-header">
          <Sparkles size={28} strokeWidth={1.8} aria-hidden />
          <p className="lobby-destination-kicker">COMING SOON</p>
          <h1>곧 스크린에서 만날 영화</h1>
          <p>개봉일을 확인하고 미리 찜해보세요</p>
        </header>

        <div
          className="upcoming-period-tabs"
          role="tablist"
          aria-label="개봉 시기 필터"
        >
          {periods.map((period) => (
            <button
              key={period.key}
              type="button"
              role="tab"
              aria-selected={selectedPeriod === period.key}
              className={selectedPeriod === period.key ? 'is-active' : ''}
              onClick={() => handlePeriodChange(period.key)}
            >
              {period.label}
            </button>
          ))}
        </div>

        <section
          className="upcoming-list"
          aria-label="앞으로 극장에서 만날 영화"
        >
          {loading ? (
            <UpcomingMovieListSkeleton />
          ) : error ? (
            <p>{error}</p>
          ) : movies.length === 0 ? (
            <p>현재 개봉 예정작이 없어요.</p>
          ) : (
            movies.map((movie, index) => {
              const poster = tmdbPosterUrl(movie.posterPath, 'w185');
              const interested = interestedIds.includes(movie.tmdbId);
              const toggling = togglingInterestId === movie.tmdbId;
              const isDetailOpen = detailMovieId === movie.tmdbId;
              const selectedDetailMovie = isDetailOpen ? detailMovie : null;
              const releaseInfo = getReleaseDateDisplay(
                movie.releaseDate,
                movie.originalReleaseDate,
              );

              return (
                <Dialog.Root
                  key={movie.tmdbId}
                  open={isDetailOpen}
                  onOpenChange={(open) => {
                    if (!open && isDetailOpen) {
                      setDetailMovieId(null);
                      setDetailMovie(null);
                    }
                  }}
                >
                  <article className="upcoming-movie-card">
                    {poster ? (
                      <Image
                        src={poster}
                        alt={`${movie.title} 포스터`}
                        width={72}
                        height={108}
                        priority={index === 0}
                      />
                    ) : null}

                    <div>
                      <h2>{movie.title}</h2>
                      <p
                        className={
                          isTodayKst(movie.releaseDate)
                            ? 'upcoming-release-date is-today'
                            : 'upcoming-release-date'
                        }
                      >
                        <span className="upcoming-release-date-primary">
                          {releaseInfo.primary}
                        </span>
                        {releaseInfo.secondary ? (
                          <span className="upcoming-release-date-secondary">
                            {releaseInfo.secondary}
                          </span>
                        ) : null}
                      </p>
                      <p>관심 등록 {movie.interestCount}명</p>
                    </div>

                    <div className="upcoming-card-actions">
                      <button
                        type="button"
                        className="upcoming-interest-button"
                        aria-pressed={interested}
                        disabled={toggling}
                        onClick={() => void handleInterestClick(movie.tmdbId)}
                      >
                        <Heart
                          width={18}
                          height={18}
                          strokeWidth={2}
                          fill={interested ? 'currentColor' : 'none'}
                          aria-hidden
                        />
                        {interested ? '관심 등록됨' : '보고 싶어요'}
                      </button>

                      <Dialog.Trigger asChild>
                        <button
                          type="button"
                          className="upcoming-detail-button"
                          onClick={() => void handleDetailClick(movie.tmdbId)}
                          disabled={loadingDetailId === movie.tmdbId}
                        >
                          {loadingDetailId === movie.tmdbId
                            ? '불러오는 중...'
                            : '상세 보기'}
                        </button>
                      </Dialog.Trigger>
                    </div>
                  </article>

                  {selectedDetailMovie ? (
                    <MovieDetailModal
                      movie={selectedDetailMovie}
                      marks={{
                        wish: interestedIds.includes(selectedDetailMovie.id),
                        watched: false,
                      }}
                      showWatchedMark={false}
                      releaseNotificationEnabled={
                        releaseNotificationById[selectedDetailMovie.id] ?? false
                      }
                      onToggleReleaseNotification={() => {
                        void handleReleaseNotificationToggle();
                      }}
                      onToggleMark={(kind) => {
                        if (kind === 'wish') {
                          void handleInterestClick(selectedDetailMovie.id);
                        }
                      }}
                      onClose={() => {
                        setDetailMovieId(null);
                        setDetailMovie(null);
                      }}
                    />
                  ) : isDetailOpen ? (
                    <MovieDetailModalSkeleton />
                  ) : null}
                </Dialog.Root>
              );
            })
          )}
          {loadingMore ? <UpcomingMovieListSkeleton count={2} /> : null}
          {hasNext ? (
            <button
              type="button"
              className="upcoming-load-more"
              onClick={() => void handleLoadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          ) : null}
        </section>
      </section>
    </main>
  );
}

export default function UpcomingPage() {
  return (
    <Suspense fallback={null}>
      <UpcomingPageContent />
    </Suspense>
  );
}
