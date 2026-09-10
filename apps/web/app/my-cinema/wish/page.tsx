'use client';

import { MovieShelf } from '@/components/my-cinema/MovieShelf';
import '../../styles/my-cinema.css';
import '../../styles/movie-detail-modal.css';
import '../../styles/lobby.css';
import '../../styles/common.css';

export default function WishShelfPage() {
  return <MovieShelf kind="wish" title="보고 싶은 영화" />;
}
