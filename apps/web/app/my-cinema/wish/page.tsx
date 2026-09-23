'use client';

import { UserMovieShelf } from '@/components/my-cinema/UserMovieShelf';
import '@/styles/my-cinema.css';
import '@/styles/wish.css';
import '@/styles/poster-picker-modal.css';
import '@/styles/movie-detail-modal.css';
import '@/styles/moviechart-modal.css';
import '@/styles/lobby.css';
import '@/styles/common.css';
import '@/styles/cinemo-select.css';
import '@/styles/cinemo-nav.css';
import '@/styles/cinemo-page-header.css';

export default function WishShelfPage() {
  return <UserMovieShelf kind="wish" title="보고 싶은 영화" />;
}
