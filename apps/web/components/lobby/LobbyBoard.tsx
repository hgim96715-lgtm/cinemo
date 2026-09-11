'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Calendar, Minus } from 'lucide-react';
import type { LobbyBoardResponse } from '@cinemo/shared';
import {
  getLobbyBoardRequest,
  recordLobbyVisitRequest,
} from '@/lib/lobby-board-api';
import { kstLobbyDateLabel } from '@/lib/date-kst';
import { useAuthStore } from '@/lib/auth-store';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import Image from 'next/image';
import { LobbyBoardSkeleton } from './LobbyBoardSkeleton';

const chartNumberFormatter = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatChartCount(count: number) {
  if (count < 10_000) {
    return chartNumberFormatter.format(count);
  }

  const value = Math.floor((count / 10_000) * 10) / 10;

  return `${value.toLocaleString('ko-KR', {
    maximumFractionDigits: 1,
  })}만`;
}

type ChartMovie = {
  tmdbId: number;
  title: string;
  count: number;
  posterPath?: string | null;
  rankChange?: number | null;
};

function RankChange({ value }: { value?: number | null }) {
  if (value === undefined) return null;

  if (value === null) {
    return <span className="lobby-rank-new">NEW</span>;
  }

  if (value > 0) {
    return (
      <span className="lobby-rank-up">
        <ArrowUp size={11} aria-hidden />
        {value}
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="lobby-rank-down">
        <ArrowDown size={11} aria-hidden />
        {Math.abs(value)}
      </span>
    );
  }

  return (
    <span className="lobby-rank-same">
      <Minus size={11} aria-hidden />
    </span>
  );
}

function WeekListViz({ movies }: { movies: ChartMovie[] }) {
  const slots = [0, 1, 2].map((index) => movies[index] ?? null);

  return (
    <ul className="lobby-chart-list">
      {slots.map((movie, index) => (
        <li
          key={movie?.tmdbId ?? index}
          className={`lobby-chart-row${movie ? '' : ' lobby-chart-row--empty'}`}
        >
          <div className="lobby-chart-row-header">
            <span className="lobby-chart-row-rank">{index + 1}</span>
            <RankChange value={movie?.rankChange} />
          </div>

          <div className="lobby-chart-row-content">
            {movie?.posterPath && tmdbPosterUrl(movie.posterPath, 'w185') ? (
              <Image
                className="lobby-chart-row-poster"
                src={tmdbPosterUrl(movie.posterPath, 'w185')!}
                alt={`${movie.title} 포스터`}
                width={42}
                height={62}
                sizes="42px"
                priority={index === 0}
              />
            ) : (
              <span
                className="lobby-chart-row-poster lobby-chart-row-poster--empty"
                aria-hidden
              />
            )}

            <span className="lobby-chart-row-info">
              <span className="lobby-chart-row-title">
                {movie?.title ?? '—'}
              </span>

              <span className="lobby-chart-row-count">
                {movie ? `${formatChartCount(movie.count)}명` : ''}
              </span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChartShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <article className="lobby-chart">
      <div className="lobby-chart-heading">
        <span className="lobby-chart-label">{label}</span>
      </div>
      <div className="lobby-chart-viz">{children}</div>
    </article>
  );
}

export function LobbyBoard() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [board, setBoard] = useState<LobbyBoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState(kstLobbyDateLabel);
  const [loading, setLoading] = useState(true);
  const [boardMode, setBoardMode] = useState<'box-office' | 'upcoming'>(
    'box-office',
  );

  const chartMovies =
    boardMode === 'box-office'
      ? (board?.boxOfficeMovies ?? []).map((movie) => ({
          tmdbId: movie.rank,
          title: movie.title,
          count: movie.audienceCount,
          posterPath: movie.posterPath,
          rankChange: movie.rankChange,
        }))
      : boardMode === 'upcoming'
        ? (board?.upcomingInterestMovies ?? []).map((movie) => ({
            tmdbId: movie.tmdbId,
            title: movie.title,
            count: movie.interestCount,
            posterPath: movie.posterPath,
          }))
        : [];
  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const next = await getLobbyBoardRequest();

        if (!cancelled) {
          setBoard(next);
        }

        if (accessToken) {
          void recordLobbyVisitRequest(accessToken).catch(() => undefined);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '데이터를 불러오는데 실패했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hydrated]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setDateLabel(kstLobbyDateLabel());
    }, 60_000);
    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  return (
    <section className="lobby-board-block">
      <div className="lobby-board-lights" aria-hidden>
        <span className="lobby-lamp">
          <span className="lobby-lamp-stem" />
          <span className="lobby-lamp-shade" />
        </span>
        <span className="lobby-lamp">
          <span className="lobby-lamp-stem" />
          <span className="lobby-lamp-shade" />
        </span>
      </div>
      <h1 className="lobby-board-brand">CINEMO</h1>
      <p className="lobby-board-date">
        <Calendar className="lobby-board-date-icon" aria-hidden />
        <span suppressHydrationWarning>{dateLabel || '—'}</span>
      </p>
      {error ? <p className="lobby-board-date">{error}</p> : null}
      <div className="lobby-board" aria-label="전광판">
        <div className="lobby-board-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={boardMode === 'box-office'}
            className={boardMode === 'box-office' ? 'is-active' : ''}
            onClick={() => setBoardMode('box-office')}
          >
            BOX OFFICE NOW
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={boardMode === 'upcoming'}
            className={boardMode === 'upcoming' ? 'is-active' : ''}
            onClick={() => setBoardMode('upcoming')}
          >
            UPCOMING INTEREST
          </button>
        </div>

        <div className="lobby-board-slots">
          <ChartShell
            label={boardMode === 'box-office' ? '누적 관객수' : '관심 등록수'}
          >
            {loading ? (
              <LobbyBoardSkeleton />
            ) : (
              <WeekListViz movies={chartMovies} />
            )}
          </ChartShell>
        </div>
      </div>
    </section>
  );
}
