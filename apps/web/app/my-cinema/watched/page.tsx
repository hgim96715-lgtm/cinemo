'use client';

import { UserMovieShelf } from '@/components/my-cinema/UserMovieShelf';
import '@/styles/my-cinema.css';
import '@/styles/poster-picker-modal.css';
import '@/styles/watched.css';
import '@/styles/movie-detail-modal.css';
import '@/styles/confirm-modal.css';
import '@/styles/moviechart-modal.css';
import '@/styles/lobby.css';
import '@/styles/common.css';
import '@/styles/cinemo-select.css';
import '@/styles/cinemo-nav.css';
import '@/styles/cinemo-page-header.css';

export default function WatchedShelfPage() {
  return <UserMovieShelf kind="watched" title="관람 기록" />;
}
