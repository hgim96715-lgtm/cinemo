import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getUserMovieCalendarRequest } from '@/lib/user-movie-api';

export const myCinemaQueryKeys = {
  calendar: (userId: string | null, from: string, to: string) =>
    ['my-cinema', 'calendar', userId, from, to] as const,
};

export const userMovieCalendarOptions = (
  accessToken: string | null,
  userId: string | null,
  from: string,
  to: string,
) =>
  queryOptions({
    queryKey: myCinemaQueryKeys.calendar(userId, from, to),
    queryFn: () => {
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.');
      }
      return getUserMovieCalendarRequest(accessToken, from, to);
    },
    enabled: Boolean(accessToken && userId && from && to),
    placeholderData: keepPreviousData,
  });
