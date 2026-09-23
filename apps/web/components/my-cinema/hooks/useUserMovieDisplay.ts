'use client';

import { useCallback, useEffect, useState } from 'react';
import { listDisplayedUserMoviesRequest, updateUserMovieDisplayRequest } from '@/lib/user-movie-api';

type Args = {
  accessToken: string | null;
  onLimitReached: () => void;
};

export function useUserMovieDisplay({ accessToken, onLimitReached }: Args) {
  const [displayedSlots, setDisplayedSlots] = useState<Record<number, number>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  const loadDisplayedSlots = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      const response = await listDisplayedUserMoviesRequest(accessToken);
      setDisplayedSlots(
        Object.fromEntries(
          response.items.map((item) => [item.tmdbId, item.wallSlot]),
        ),
      );
      setError(null);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : '홈 티켓 표시 상태를 불러오지 못했습니다.',
      );
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDisplayedSlots();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDisplayedSlots]);

  const toggleDisplay = useCallback(
    async (tmdbId: number) => {
      if (!accessToken) {
        return;
      }

      const currentSlot = displayedSlots[tmdbId];

      try {
        if (currentSlot) {
          await updateUserMovieDisplayRequest(accessToken, {
            tmdbId,
            kind: 'watched',
            isDisplayed: false,
            wallSlot: currentSlot,
          });

          setDisplayedSlots((previous) => {
            const next = { ...previous };
            delete next[tmdbId];
            return next;
          });
          return;
        }

        const usedSlots = new Set(Object.values(displayedSlots));
        const emptySlot = [1, 2, 3].find((slot) => !usedSlots.has(slot));

        if (!emptySlot) {
          onLimitReached();
          return;
        }

        await updateUserMovieDisplayRequest(accessToken, {
          tmdbId,
          kind: 'watched',
          isDisplayed: true,
          wallSlot: emptySlot,
        });

        setDisplayedSlots((previous) => ({
          ...previous,
          [tmdbId]: emptySlot,
        }));
      } catch (cause: unknown) {
        setError(
          cause instanceof Error
            ? cause.message
            : '홈 티켓 표시 상태를 변경하지 못했습니다.',
        );
      }
    },
    [accessToken, displayedSlots, onLimitReached],
  );

  return {
    displayedSlots,
    error,
    loadDisplayedSlots,
    toggleDisplay,
  };
}
