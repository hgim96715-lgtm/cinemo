'use client';

import { useEffect, useState } from 'react';
import { CinemoNav } from '@/components/common/CinemoNav';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';
import { MovieChartTrailerModal } from '@/components/moviechart/MovieChartTrailerModal';
import { MovieChartListSkeleton } from '@/components/moviechart/MovieChartListSkeleton';
import { MovieChartContentTabs } from '@/components/moviechart/MovieChartContentTabs';
import {
  getMovieChartHistoryRequest,
  getMovieChartRequest,
} from '@/lib/lobby-board-api';
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

export default function MovieChartPage() {
  const [movies, setMovies] = useState<MovieChartItem[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<MovieChartItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [history, setHistory] = useState<MovieChartHistoryResponse>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [detailMovie, setDetailMovie] = useState<MovieDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [modealError, setModalError] = useState<string | null>(null);

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
            error instanceof Error
              ? error.message
              : '영화 차트를 불러오지 못했습니다.',
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
      setHistoryLoading(true);

      try {
        const response = await getMovieChartHistoryRequest(fromDate, date);

        if (!cancelled) {
          setHistory(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : '영화 차트 흐름을 불러오지 못했습니다.',
          );
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
        error instanceof Error ? error.message : '모달이 열리지 않습니다.',
      );
    } finally {
      setLoadingDetailId(null);
    }
  }

  return (
    <main className="movie-chart-page">
      <CinemoPageHeader
        className="movie-chart-header"
        eyebrow="MOVIE CHART"
        eyebrowClassName="movie-chart-kicker"
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
      {error ? <p>{error}</p> : null}
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
            onClose={() => setDetailMovie(null)}
          />
        </Dialog.Root>
      ) : null}
    </main>
  );
}
