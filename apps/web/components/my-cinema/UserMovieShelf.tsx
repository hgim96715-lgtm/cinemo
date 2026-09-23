'use client';

import type { UserMovieKind } from '@cinemo/shared';
import { WatchedMovieShelf } from './WatchedMovieShelf';
import { WishMovieShelf } from './WishMovieShelf';

type Props = {
  kind: UserMovieKind;
  title: string;
};

export function UserMovieShelf({ kind, title }: Props) {
  return kind === 'watched' ? (
    <WatchedMovieShelf title={title} />
  ) : (
    <WishMovieShelf title={title} />
  );
}
