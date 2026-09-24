'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserMovieKind } from '@cinemo/shared';
import type { UserMovieListItem } from '@cinemo/api-contract';
import { listUserMoviesRequest } from '@/lib/user-movie-api';

const PAGE_SIZE = 9;

type Args = {
  accessToken: string | null;
  hasUser: boolean;
  kind: UserMovieKind;
};

export function useUserMovieList({ accessToken, hasUser, kind }: Args) {
  const [items, setItems] = useState<UserMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadMovies = useCallback(
    async (cursor?: string) => {
      if (!accessToken || !hasUser) {
        return;
      }

      const isFirstPage = !cursor;

      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const response = await listUserMoviesRequest(
          accessToken,
          kind,
          PAGE_SIZE,
          cursor,
        );

        setItems((previous) =>
          isFirstPage ? response.items : [...previous, ...response.items],
        );
        setHasNext(response.hasNext);
        setNextCursor(response.nextCursor);
      } catch (cause: unknown) {
        setError(
          cause instanceof Error
            ? cause.message
            : '목록을 불러오지 못했습니다.',
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken, hasUser, kind],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMovies();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMovies]);

  const loadMore = useCallback(async () => {
    if (!hasNext || !nextCursor || loadingMore) {
      return;
    }

    await loadMovies(nextCursor);
  }, [hasNext, loadMovies, loadingMore, nextCursor]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasNext,
    loadMovies,
    loadMore,
  };
}
