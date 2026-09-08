'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UserMovieStats } from '@cinemo/shared';
import { getUserMovieStatsRequest } from '@/lib/user-movie-api';

type Props = {
  token: string;
  year: number;
};

type MovieStatsYearSelectProps = {
  value: number;
  years: number[];
  onChange: (year: number) => void;
};

function MovieStatsYearSelect({
  value,
  years,
  onChange,
}: MovieStatsYearSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`movie-stats-year-select${open ? ' is-open' : ''}`}
    >
      <button
        type="button"
        className="movie-stats-year-trigger"
        aria-label="통계 연도 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}년</span>
        <ChevronDown size={18} strokeWidth={1.7} aria-hidden />
      </button>

      {open ? (
        <div
          className="movie-stats-year-menu"
          role="listbox"
          aria-label="통계 연도 선택"
        >
          {years.map((optionYear) => (
            <button
              key={optionYear}
              type="button"
              className="movie-stats-year-option"
              role="option"
              aria-selected={optionYear === value}
              onClick={() => {
                onChange(optionYear);
                setOpen(false);
              }}
            >
              {optionYear}년
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MovieStatsPanel({ token, year }: Props) {
  const [stats, setStats] = useState<UserMovieStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(year);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setLoading(true);
      try {
        const response = await getUserMovieStatsRequest(token, selectedYear);
        if (!cancelled) setStats(response);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [token, selectedYear]);

  if (loading) {
    return (
      <section className="movie-stats-panel">
        <p>관람 통계를 불러오는 중…</p>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="movie-stats-panel">
        <p>관람 통계를 불러오지 못했어요.</p>
      </section>
    );
  }

  const maxMonthlyCount = Math.max(
    1,
    ...stats.monthly.map((item) => item.count),
  );
  const years = Array.from(
    { length: year - 1999 },
    (_, index) => year - index,
  );

  return (
    <section className="movie-stats-panel" aria-label={`${year}년 관람 통계`}>
      <p className="movie-stats-kicker">MOVIE STATS</p>
      <MovieStatsYearSelect
        value={selectedYear}
        years={years}
        onChange={setSelectedYear}
      />
      <strong className="movie-stats-total">{stats.total}편</strong>

      <ul className="movie-stats-monthly">
        {stats.monthly.map((item) => (
          <li key={item.month} aria-label={`${item.month}월 ${item.count}편`}>
            <strong>{item.count}</strong>
            <span className="movie-stats-bar" aria-hidden="true">
              <span
                className="movie-stats-bar-fill"
                style={{
                  height: `${(item.count / maxMonthlyCount) * 100}%`,
                }}
              />
            </span>
            <span className="movie-stats-month-label">{item.month}월</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
