'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import '../styles/lobby.css';
import '../styles/upcoming.css';
import '../styles/my-cinema.css';
import '../styles/movie-detail-modal.css';
import '../styles/confirm-modal.css';
import '../styles/common.css';

import { GachaMovie } from '@cinemo/shared';
import { getMovieDetailRequest } from '@/lib/tmdb-api';
import { MovieDetailModal } from '@/components/my-cinema/MovieDetailModal';
import { CinemoNav } from '@/components/common/CinemoNav';

type UpcomingPeriod = {
  key: string;
  label: string;
};

function getUpcomingPeriods(): UpcomingPeriod[] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
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

export default function UpcomingPage() {
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

  const [detailMovie, setDetailMovie] = useState<GachaMovie | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  const [releaseNotificationById, setReleaseNotificationById] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    const month = new URLSearchParams(window.location.search).get('month');

    setSelectedPeriod(
      month && periods.some((period) => period.key === month) ? month : 'all',
    );
  }, []);

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
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
    }).format(new Date());

    return releaseDate === today;
  }

  function formatReleaseDate(releaseDate: string) {
    const [year, month, day] = releaseDate.split('-');
    if (!year || !month || !day) return '개봉일 미정';

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const today = [
      parts.find((part) => part.type === 'year')?.value,
      parts.find((part) => part.type === 'month')?.value,
      parts.find((part) => part.type === 'day')?.value,
    ].join('-');

    if (releaseDate === today) return '오늘 개봉';

    return `${year}.${month}.${day} 개봉 예정`;
  }

  function handlePeriodChange(period: string) {
    setSelectedPeriod(period);

    const params = new URLSearchParams(window.location.search);

    if (period === 'all') {
      params.delete('month');
    } else {
      params.set('month', period);
    }

    const query = params.toString();

    window.history.replaceState(
      null,
      '',
      query ? `/upcoming?${query}` : '/upcoming',
    );
  }

  async function handleDetailClick(tmdbId: number) {
    setLoadingDetailId(tmdbId);

    try {
      const movie = await getMovieDetailRequest(tmdbId);
      const upcomingMovie = movies.find((item) => item.tmdbId === tmdbId);

      if (accessToken) {
        try {
          const notification = await getMovieReleaseNotificationRequest(
            accessToken,
            tmdbId,
          );

          setReleaseNotificationById((current) => ({
            ...current,
            [tmdbId]: notification.enabled,
          }));
        } catch {
          setReleaseNotificationById((current) => ({
            ...current,
            [tmdbId]: false,
          }));
        }
      }

      setDetailMovie({
        ...movie,
        release_date: upcomingMovie?.releaseDate ?? movie.release_date,
      });
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
      await updateMovieReleaseNotificationRequest(accessToken, tmdbId, enabled);

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
            <p>개봉 예정작을 불러오는 중이에요.</p>
          ) : error ? (
            <p>{error}</p>
          ) : movies.length === 0 ? (
            <p>현재 개봉 예정작이 없어요.</p>
          ) : (
            movies.map((movie) => {
              const poster = tmdbPosterUrl(movie.posterPath, 'w185');
              const interested = interestedIds.includes(movie.tmdbId);
              const toggling = togglingInterestId === movie.tmdbId;

              return (
                <article className="upcoming-movie-card" key={movie.tmdbId}>
                  {poster ? (
                    <Image
                      src={poster}
                      alt={`${movie.title} 포스터`}
                      width={72}
                      height={108}
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
                      {formatReleaseDate(movie.releaseDate)}
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
                  </div>
                </article>
              );
            })
          )}
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
          {detailMovie ? (
            <MovieDetailModal
              movie={detailMovie}
              marks={{
                wish: interestedIds.includes(detailMovie.id),
                watched: false,
              }}
              showWatchedMark={false}
              releaseNotificationEnabled={
                releaseNotificationById[detailMovie.id] ?? false
              }
              onToggleReleaseNotification={() => {
                void handleReleaseNotificationToggle();
              }}
              onToggleMark={(kind) => {
                if (kind === 'wish') {
                  void handleInterestClick(detailMovie.id);
                }
              }}
              onClose={() => setDetailMovie(null)}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}
