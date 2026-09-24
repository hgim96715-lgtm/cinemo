'use client';

import { useQuery } from '@tanstack/react-query';
import { userMovieCalendarOptions } from '@/queries/my-cinema';

type Params = {
  accessToken: string | null;
  userId: string | null;
  from: string;
  to: string;
};

export function useUserMovieCalendar({
  accessToken,
  userId,
  from,
  to,
}: Params) {
  return useQuery(userMovieCalendarOptions(accessToken, userId, from, to));
}
