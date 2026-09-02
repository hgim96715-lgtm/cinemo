'use client';

import { MovieShelf } from '@/components/room/MovieShelf';
import { MovieStatsPanel } from '@/components/room/MovieStatsPanel';
import { useAuthStore } from '@/lib/auth-store';
import { kstDateKey } from '@/lib/date-kst';
import '../../styles/room.css';
import '../../styles/lobby.css';

export default function WatchedShelfPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const year = Number(kstDateKey().slice(0, 4));

  return (
    <div className="watched-page">
      {accessToken ? <MovieStatsPanel token={accessToken} year={year} /> : null}

      <MovieShelf kind="watched" title="관람 기록" />
    </div>
  );
}
