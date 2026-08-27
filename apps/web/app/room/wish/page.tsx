'use client';

import { MovieShelf } from '@/components/room/MovieShelf';
import '../../styles/room.css';
import '../../styles/lobby.css';

export default function WishShelfPage() {
  return <MovieShelf kind="wish" title="보고 싶은 영화" />;
}
