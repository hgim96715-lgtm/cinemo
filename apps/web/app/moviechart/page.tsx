'use client';

import { useEffect, useState } from 'react';
import { CinemoNav } from '@/components/common/CinemoNav';
import { MovieChartTrailerModal } from '@/components/moviechart/MovieChartTrailerModal';
import { MovieChartListSkeleton } from '@/components/moviechart/MovieChartListSkeleton';
import { MovieChartContentTabs } from '@/components/moviechart/MovieChartContentTabs';
import {
  getMovieChartHistoryRequest,
  getMovieChartRequest,
} from '@/lib/lobby-board-api';
import { formatKstLongDate } from '@/lib/date-kst';
import '@/styles/common.css';
import '@/styles/moviechart.css';
import '@/styles/moviechart-chart.css';
import '@/styles/moviechart-modal.css';
import type {
  MovieChartHistoryResponse,
  MovieChartItem,
} from '@cinemo/api-contract';

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

  return (
    <main className="movie-chart-page">
      <CinemoNav
        showRightLink
        rightHref="/postcard"
        rightLabel="POSTCARD"
        rightAriaLabel="CINEMO 엽서로 이동"
      />
      <header className="movie-chart-header">
        <span className="movie-chart-kicker">MOVIE CHART</span>
        <h1>오늘의 영화 순위</h1>
        <p>누적 관객 수와 전일 대비 순위를 확인해보세요.</p>

        <div className="movie-chart-meta" aria-label="영화 차트 기준 정보">
          <span>KOBIS 일일 박스오피스</span>
          <span aria-hidden="true">·</span>
          <span>누적 관객 수 · 순위 변동</span>
          {targetDate ? (
            <span>기준일 {formatKstLongDate(targetDate)}</span>
          ) : null}
        </div>
      </header>
      {loading ? <MovieChartListSkeleton /> : null}
      {error ? <p>{error}</p> : null}
      {!loading && !error ? (
        <MovieChartContentTabs
          movies={movies}
          history={history}
          historyLoading={historyLoading}
          historyError={historyError}
          onSelectTrailer={setSelectedTrailer}
        />
      ) : null}
      {selectedTrailer ? (
        <MovieChartTrailerModal
          movie={selectedTrailer}
          onClose={() => setSelectedTrailer(null)}
        />
      ) : null}
    </main>
  );
}
