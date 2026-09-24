'use client';

import { useEffect, useState } from 'react';
import type { AdminAnalytics } from '@cinemo/shared';
import { getAdminAnalyticsRequest } from '@/lib/admin-api';
import { useAuthStore } from '@/lib/auth-store';

export function useAdminAnalytics() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let cancelled = false;
    async function load() {
      try {
        const data = await getAdminAnalyticsRequest(token);
        if (!cancelled) setAnalytics(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : '차트를 불러오는데 실패했습니다.',
          );
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { analytics, error, loading: !analytics && !error };
}
