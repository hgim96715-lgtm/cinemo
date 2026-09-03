'use client';

import { MovieShelf } from '@/components/room/MovieShelf';
import '../../styles/room.css';
import '../../styles/lobby.css';

export default function WatchedShelfPage() {
  return <MovieShelf kind="watched" title="관람 기록" />;
}
