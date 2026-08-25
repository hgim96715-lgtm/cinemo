import type {
  AdminAnalytics,
  AdminOverview,
  AdminPeople,
  AdminPeopleFeed,
} from '@cinemo/shared';
import { apiFetch } from './api';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3050';
export async function downloadDailyExcelRequest(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/v1/admin/reports/daily-excel`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      if (body.trim()) message = body;
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const filename =
    response.headers
      .get('content-disposition')
      ?.match(/filename="([^"]+)"/)?.[1] ?? 'cinemo-daily-report.xlsx';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export type AdminDailyReportStatus = {
  id: string;
  date: string;
  status: 'running' | 'succeeded' | 'failed';
  filename: string | null;
  dailyRowCount: number;
  hourlyRowCount: number;
  visitRowCount: number;
  loginRowCount: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export async function getDailyExcelStatusRequest(
  token: string,
): Promise<AdminDailyReportStatus | null> {
  const response = await apiFetch<{
    report: AdminDailyReportStatus | null;
  }>('/admin/reports/daily-excel/status', { token });

  return response.report;
}
