'use client';

import { AdminHoursChart } from '@/components/admin/AdminCharts';
import { AdminChartPage } from '@/components/admin/AdminChartPage';

export default function AdminHoursPage() {
  return (
    <AdminChartPage
      title="시간대 분석"
      sub="오늘 로비 방문 · 최근 7일 시간대 흐름"
    >
      {(analytics) => <AdminHoursChart analytics={analytics} />}
    </AdminChartPage>
  );
}
