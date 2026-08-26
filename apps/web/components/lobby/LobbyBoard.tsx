'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Calendar } from 'lucide-react';
import type { BoardWeekTopMovie, LobbyBoardResponse } from '@cinemo/shared';
import {
  getLobbyBoardRequest,
  recordLobbyVisitRequest,
} from '@/lib/lobby-board-api';
import { kstLobbyDateLabel } from '@/lib/date-kst';
import { useAuthStore } from '@/lib/auth-store';

const TODAY_HOUR_LABELS = ['0', '4', '8', '12', '16', '20'] as const;

function MiniSpark({
  series,
  labels,
}: {
  series: number[] | null;
  labels?: readonly string[];
}) {
  const hasData = Boolean(series?.some((n) => n > 0));
  const bars = hasData && series ? series : [2, 4, 3, 5, 4, 6];
  const max = Math.max(...bars, 1);

  return (
    <div
      className={`lobby-chart-spark${hasData ? ' lobby-chart-spark--live' : ''}${labels ? ' lobby-chart-spark--labeled' : ''}`}
    >
      <div className="lobby-chart-spark-bars" aria-hidden>
        {bars.map((n, i) => (
          <span
            key={i}
            style={{
              height: `${hasData ? Math.max(n > 0 ? 20 : 8, (n / max) * 100) : 30 + n * 8}%`,
            }}
          />
        ))}
      </div>
      {labels ? (
        <div className="lobby-chart-spark-labels" aria-hidden>
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StatViz({
  primary,
  secondary,
  series,
  labels,
}: {
  primary: string;
  secondary: string;
  series: number[] | null;
  labels?: readonly string[];
}) {
  return (
    <div className="lobby-chart-stat">
      <p className="lobby-chart-stat-primary">{primary}</p>
      <p className="lobby-chart-stat-secondary">{secondary}</p>
      <MiniSpark series={series} labels={labels} />
    </div>
  );
}

function WeekListViz({ movies }: { movies: BoardWeekTopMovie[] }) {
  const slots: (BoardWeekTopMovie | null)[] = [0, 1, 2].map(
    (i) => movies[i] ?? null,
  );
  const max = Math.max(1, ...slots.map((m) => m?.count ?? 0));

  return (
    <ul className="lobby-chart-list">
      {slots.map((movie, i) => (
        <li
          key={i}
          className={`lobby-chart-row${movie ? '' : ' lobby-chart-row--empty'}`}
        >
          <span className="lobby-chart-row-rank">{i + 1}</span>
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
            {movie ? `${movie.count}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ChartShell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <article className="lobby-chart">
      <div className="lobby-chart-viz">{children}</div>
      <div className="lobby-chart-meta">
        <p className="lobby-chart-label">{label}</p>
      </div>
    </article>
  );
}

export function LobbyBoard() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [board, setBoard] = useState<LobbyBoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDateLabel(kstLobbyDateLabel());
  }, []);

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

  const weekMovies = board?.weekTopMovies ?? [];
  const todayCount = board?.todayReviewCount ?? 0;
  const weekCount = board?.weekReviewCount ?? 0;

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
          <p className="lobby-board-loading">통계를 불러오는 중…</p>
        ) : (
          <div className="lobby-board-slots">
            <ChartShell label="오늘 입장">
              <StatViz
                primary={
                  board?.todayVisits != null ? `${board.todayVisits}` : '—'
                }
                secondary={
                  board?.todayVisits != null
                    ? '명 방문 (KST)'
                    : '로그인 후 집계'
                }
                series={board?.todayVisitSeries ?? null}
                labels={TODAY_HOUR_LABELS}
              />
            </ChartShell>

            <ChartShell label="오늘의 후기">
              <StatViz
                primary={todayCount > 0 ? `${todayCount}` : '—'}
                secondary={todayCount > 0 ? '건 (KST)' : '아직 없음'}
                series={board?.todayReviewSeries ?? null}
                labels={TODAY_HOUR_LABELS}
              />
            </ChartShell>

            <ChartShell label="주간 TOP 3">
              {weekCount > 0 ? (
                <WeekListViz movies={weekMovies} />
              ) : (
                <StatViz
                  primary="—"
                  secondary="이번 주 후기 없음"
                  series={null}
                />
              )}
            </ChartShell>
          </div>
        )}
      </div>
    </section>
  );
}
