'use client';

import { useEffect, useState } from 'react';
import type { UserMovieStats } from '@cinemo/shared';
import { getUserMovieStatsRequest } from '@/lib/user-movie-api';

type Props = {
  token: string;
  year: number;
};

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

  return (
    <section className="movie-stats-panel" aria-label={`${year}년 관람 통계`}>
      <p className="movie-stats-kicker">MOVIE STATS</p>
      <select
        value={selectedYear}
        onChange={(event) => setSelectedYear(Number(event.target.value))}
        aria-label="통계 연도 선택"
      >
        {Array.from({ length: year - 1999 }, (_, index) => year - index).map(
          (optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}년
            </option>
          ),
        )}
      </select>
      <strong className="movie-stats-total">{stats.total}편</strong>

      <ul className="movie-stats-monthly">
        {stats.monthly.map((item) => (
          <li key={item.month}>
            <span>{item.month}월</span>
            <strong>{item.count}편</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
