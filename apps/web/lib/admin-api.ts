import type {
  AdminAnalytics,
  AdminOverview,
  AdminPeople,
  AdminPeopleFeed,
} from '@cinemo/shared';
import { apiFetch } from './api-fetch';

export function getAdminOverviewRequest(token: string) {
  return apiFetch<AdminOverview>('/admin/overview', { token });
}

export function getAdminPeopleRequest(token: string) {
  return apiFetch<AdminPeople>('/admin/people', { token });
}

export function getAdminPeopleFeedRequest(token: string, skip: number) {
  return apiFetch<AdminPeopleFeed>(`/admin/people/feed?skip=${skip}`, {
    token,
  });
}

export function getAdminAnalyticsRequest(
  token: string,
  from?: string,
  to?: string,
) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return apiFetch<AdminAnalytics>(
    `/admin/analytics${query ? `?${query}` : ''}`,
    { token },
  );
}
