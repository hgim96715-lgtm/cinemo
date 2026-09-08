'use client';

import { MovieShelf } from '@/components/my-cinema/MovieShelf';
import '../../styles/my-cinema.css';
import '../../styles/lobby.css';

export default function WatchedShelfPage() {
  return <MovieShelf kind="watched" title="관람 기록" />;
}
