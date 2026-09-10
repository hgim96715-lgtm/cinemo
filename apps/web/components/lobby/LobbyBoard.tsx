'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  LoaderCircle,
  Minus,
} from 'lucide-react';
import type { LobbyBoardResponse } from '@cinemo/shared';
import {
  getLobbyBoardRequest,
  recordLobbyVisitRequest,
} from '@/lib/lobby-board-api';
import { kstLobbyDateLabel } from '@/lib/date-kst';
import { useAuthStore } from '@/lib/auth-store';

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

function StatViz({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div className="lobby-chart-stat">
      <p className="lobby-chart-stat-primary">{primary}</p>
      <p className="lobby-chart-stat-secondary">{secondary}</p>
    </div>
  );
}
function WeekListViz({ movies }: { movies: ChartMovie[] }) {
  const slots = [0, 1, 2].map((i) => movies[i] ?? null);
  const max = Math.max(1, ...slots.map((movie) => movie?.count ?? 0));

  return (
    <ul className="lobby-chart-list">
      {slots.map((movie, index) => (
        <li
          key={movie?.tmdbId ?? index}
          className={`lobby-chart-row${movie ? '' : ' lobby-chart-row--empty'}${movie?.rankChange !== undefined ? ' lobby-chart-row--with-change' : ''}`}
        >
          <span className="lobby-chart-row-rank">{index + 1}</span>

          <span className="lobby-chart-row-title">{movie?.title ?? '—'}</span>

          <span className="lobby-chart-row-bar" aria-hidden>
            <i
              style={{
                width: movie
                  ? `${Math.max(18, (movie.count / max) * 100)}%`
                  : '0%',
              }}
            />
          </span>

          <span className="lobby-chart-row-count">
            {movie ? formatChartCount(movie.count) : ''}
          </span>

          <RankChange value={movie?.rankChange} />
        </li>
      ))}
    </ul>
  );
}

function ChartShell({ children }: { children: ReactNode }) {
  return (
    <article className="lobby-chart">
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
          rankChange: movie.rankChange,
        }))
      : boardMode === 'upcoming'
        ? (board?.upcomingInterestMovies ?? []).map((movie) => ({
            tmdbId: movie.tmdbId,
            title: movie.title,
            count: movie.interestCount,
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
        {loading ? (
          <p className="lobby-board-loading" role="status">
            <LoaderCircle
              className="lobby-board-loading-icon"
              size={22}
              strokeWidth={1.6}
              aria-hidden
            />
            <span>통계를 불러오는 중</span>
          </p>
        ) : (
          <div className="lobby-board-slots">
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

            <ChartShell>
              {chartMovies.length > 0 ? (
                <WeekListViz movies={chartMovies} />
              ) : (
                <StatViz primary="—" secondary="아직 기록 없음" />
              )}
            </ChartShell>
          </div>
        )}
      </div>
    </section>
  );
}
