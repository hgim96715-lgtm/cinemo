'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { CinemoNav } from '@/components/common/CinemoNav';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';
import { ErrorModal } from '@/components/common/ErrorModal';
import { MovieChartTrailerModal } from '@/components/moviechart/MovieChartTrailerModal';
import { MovieChartListSkeleton } from '@/components/moviechart/MovieChartListSkeleton';
import { MovieChartContentTabs } from '@/components/moviechart/MovieChartContentTabs';
import {
  getMovieChartHistoryRequest,
  getMovieChartRequest,
} from '@/lib/lobby-board-api';
import {
  listUserMoviesRequest,
  toggleUserMovieRequest,
} from '@/lib/user-movie-api';
import { useAuthStore } from '@/lib/auth-store';
import { formatKstLongDate } from '@/lib/date-kst';
import '@/styles/common.css';
import '@/styles/cinemo-nav.css';
import '@/styles/cinemo-page-header.css';
import '@/styles/moviechart.css';
import '@/styles/moviechart-chart.css';
import '@/styles/moviechart-modal.css';
import '@/styles/movie-detail-modal.css';
import type {
  MovieChartHistoryResponse,
  MovieChartItem,
  MovieDetail,
} from '@cinemo/api-contract';
import { getMovieDetailRequest } from '@/lib/tmdb-api';
import * as Dialog from '@radix-ui/react-dialog';
import { MovieDetailModal } from '@/components/my-cinema/MovieDetailModal';
import { getUserFacingErrorMessage } from '@/lib/get-user-facing-error-message';

export default function MovieChartPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [movies, setMovies] = useState<MovieChartItem[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<MovieChartItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [history, setHistory] = useState<MovieChartHistoryResponse>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyEmpty, setHistoryEmpty] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [detailMovie, setDetailMovie] = useState<MovieDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [modealError, setModalError] = useState<string | null>(null);
  const [wishMovieIds, setWishMovieIds] = useState<Set<number>>(new Set());

  const activeError = error
    ? { title: '영화 차트 조회 실패', message: error }
    : historyError
      ? { title: '영화 차트 흐름 조회 실패', message: historyError }
      : historyEmpty
        ? {
            title: '영화 차트 흐름 조회 실패',
            message: '차트 데이터를 불러오지 못했습니다.',
          }
        : modealError
          ? { title: '영화 상세 조회 실패', message: modealError }
          : null;

  useEffect(() => {
    let cancelled = false;

    async function loadWishMovieIds() {
      if (!accessToken) {
        setWishMovieIds(new Set());
        return;
      }

      try {
        const response = await listUserMoviesRequest(accessToken, 'wish');

        if (!cancelled) {
          setWishMovieIds(
            new Set(response.items.map((item) => item.tmdbId)),
          );
        }
      } catch {
        if (!cancelled) {
          setWishMovieIds(new Set());
        }
      }
    }

    void loadWishMovieIds();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadMovieChart() {
      try {
        const response = await getMovieChartRequest();

        if (!cancelled) {
          setMovies(response.items);
          setTargetDate(response.targetDate);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            getUserFacingErrorMessage(error, '영화 차트를 불러오지 못했습니다.'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMovieChart();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!targetDate) return;

    const date = targetDate;

    const [year, month] = date.split('-');
    const fromDate = `${year}-${month}-01`;
    let cancelled = false;

    async function loadMovieChartHistory() {
      setHistoryError(null);
      setHistoryEmpty(false);
      setHistoryLoading(true);

      try {
        const response = await getMovieChartHistoryRequest(fromDate, date);

        if (!cancelled) {
          setHistory(response);
          setHistoryEmpty(response.length === 0);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setHistoryError(
            getUserFacingErrorMessage(
              error,
              '영화 차트 흐름을 불러오지 못했습니다.',
            ),
          );
          setHistoryEmpty(false);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    void loadMovieChartHistory();

    return () => {
      cancelled = true;
    };
  }, [targetDate]);

  async function handleMovieDetailClick(tmdbId: number) {
    setLoadingDetailId(tmdbId);
    setModalError(null);

    try {
      const movie = await getMovieDetailRequest(tmdbId);
      setDetailMovie(movie);
    } catch (error: unknown) {
      setModalError(
        getUserFacingErrorMessage(error, '영화 상세 정보를 불러오지 못했습니다.'),
      );
    } finally {
      setLoadingDetailId(null);
    }
  }

  async function handleWishToggle(tmdbId: number) {
    if (!accessToken) {
      router.push('/login?next=/moviechart');
      return;
    }

    const previousWishMovieIds = wishMovieIds;
    const optimisticWishMovieIds = new Set(previousWishMovieIds);

    if (optimisticWishMovieIds.has(tmdbId)) {
      optimisticWishMovieIds.delete(tmdbId);
    } else {
      optimisticWishMovieIds.add(tmdbId);
    }

    setWishMovieIds(optimisticWishMovieIds);

    try {
      const result = await toggleUserMovieRequest(accessToken, tmdbId, 'wish');
      setWishMovieIds((current) => {
        const next = new Set(current);

        if (result.active) {
          next.add(tmdbId);
        } else {
          next.delete(tmdbId);
        }

        return next;
      });
    } catch {
      setWishMovieIds(previousWishMovieIds);
    }
  }

  return (
    <main className="movie-chart-page">
      {activeError ? (
        <ErrorModal
          open
          eyebrow="FAIL"
          title={activeError.title}
          description={activeError.message}
          onClose={() => {
            if (error) {
              setError(null);
            } else if (historyError) {
              setHistoryError(null);
            } else {
              setModalError(null);
            }
          }}
        />
      ) : null}
      <CinemoPageHeader
        className="movie-chart-header"
        eyebrow="MOVIE CHART"
        eyebrowClassName="movie-chart-kicker"
        leading={
          <span className="movie-chart-leading" aria-hidden="true">
            <Clapperboard size={22} strokeWidth={1.7} />
          </span>
        }
        title="오늘의 영화 순위"
        description="누적 관객 수와 전일 대비 순위를 확인해보세요."
        nav={
          <CinemoNav
            showRightLink
            rightHref="/postcard"
            rightLabel="POSTCARD"
            rightAriaLabel="CINEMO 엽서로 이동"
          />
        }
      >
        <div className="movie-chart-meta" aria-label="영화 차트 기준 정보">
          <span>KOBIS 일일 박스오피스</span>
          <span aria-hidden="true">·</span>
          <span>누적 관객 수 · 순위 변동</span>
          {targetDate ? (
            <span>기준일 {formatKstLongDate(targetDate)}</span>
          ) : null}
        </div>

        <details className="movie-chart-data-note">
          <summary>관객 수 집계 기준 안내</summary>
          <p>
            개봉 전 유료 사전 상영이나 일부 이벤트 상영 관객은 관객 수에 포함될
            수 있습니다.
            <br /> 공식 개봉일 전에도 순위와 관객 기록이 보일 수 있습니다.
          </p>
        </details>
      </CinemoPageHeader>

      {loading ? <MovieChartListSkeleton /> : null}
      {!loading && !error ? (
        <MovieChartContentTabs
          movies={movies}
          history={history}
          historyLoading={historyLoading}
          historyError={historyError}
          loadingDetailId={loadingDetailId}
          onSelectDetail={handleMovieDetailClick}
          onSelectTrailer={setSelectedTrailer}
        />
      ) : null}
      {selectedTrailer ? (
        <MovieChartTrailerModal
          movie={selectedTrailer}
          onClose={() => setSelectedTrailer(null)}
        />
      ) : null}

      {detailMovie ? (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) {
              setDetailMovie(null);
            }
          }}
        >
          <MovieDetailModal
            movie={detailMovie}
            showWatchedMark={false}
            showCalendar={false}
            movieStatus={{
              wish: wishMovieIds.has(detailMovie.id),
              watched: false,
            }}
            onToggleMark={(kind) => {
              if (kind === 'wish') {
                void handleWishToggle(detailMovie.id);
              }
            }}
            onClose={() => setDetailMovie(null)}
          />
        </Dialog.Root>
      ) : null}
    </main>
  );
}
