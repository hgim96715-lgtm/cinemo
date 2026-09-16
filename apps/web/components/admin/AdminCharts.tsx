'use client';

import { useEffect, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import type { AdminAnalytics } from '@cinemo/shared';

const GOLD = '#c4a86a';
const CREAM = '#e8dcc4';
const SLATE = '#8a96ad';
const SERIES_COLORS = [GOLD, CREAM, SLATE];

const theme = {
  background: 'transparent',
  text: { fontSize: 11, fill: '#8f877a' },
  axis: {
    domain: { line: { stroke: 'rgb(243 239 230 / 0.16)', strokeWidth: 1 } },
    ticks: {
      line: { stroke: 'rgb(243 239 230 / 0.16)', strokeWidth: 1 },
      text: { fill: '#8f877a', fontSize: 11 },
    },
  },
  grid: { line: { stroke: 'rgb(243 239 230 / 0.08)', strokeWidth: 1 } },
  legends: { text: { fill: '#8f877a', fontSize: 11 } },
  tooltip: {
    container: {
      background: '#16181f',
      color: '#f3efe6',
      fontSize: 12,
      border: '1px solid rgb(243 239 230 / 0.12)',
    },
  },
};

function dayLabel(date: string) {
  return date.slice(5).replace('-', '/');
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}시`;
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function ChartBox({
  empty,
  tall,
  pie,
  children,
}: {
  empty: boolean;
  tall?: boolean;
  pie?: boolean;
  children: React.ReactNode;
}) {
  const mounted = useMounted();
  if (empty) {
    return <p className="admin-status">아직 집계가 없어요</p>;
  }
  const className = [
    'admin-nivo',
    tall ? 'admin-nivo--tall' : '',
    pie ? 'admin-nivo--pie' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div className={className}>{mounted ? children : null}</div>;
}

export function AdminWeekPeople({ analytics }: { analytics: AdminAnalytics }) {
  const empty = analytics.series.every(
    (row) => row.signups === 0 && row.visits === 0 && row.logins === 0,
  );
  const lineData = [
    {
      id: '가입',
      data: analytics.series.map((row) => ({
        x: dayLabel(row.date),
        y: row.signups,
      })),
    },
    {
      id: '로비',
      data: analytics.series.map((row) => ({
        x: dayLabel(row.date),
        y: row.visits,
      })),
    },
    {
      id: '로그인',
      data: analytics.series.map((row) => ({
        x: dayLabel(row.date),
        y: row.logins,
      })),
    },
  ];
  const pieData = [
    {
      id: '로비',
      label: '로비',
      value: analytics.series.reduce((sum, row) => sum + row.visits, 0),
    },
    {
      id: '로그인',
      label: '로그인',
      value: analytics.series.reduce((sum, row) => sum + row.logins, 0),
    },
    {
      id: '가입',
      label: '가입',
      value: analytics.series.reduce((sum, row) => sum + row.signups, 0),
    },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="admin-charts-split">
      <ChartBox empty={empty}>
        <ResponsiveLine
          data={lineData}
          theme={theme}
          colors={SERIES_COLORS}
          margin={{ top: 12, right: 16, bottom: 48, left: 36 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
          enableGridX={false}
          axisBottom={{ tickSize: 0, tickPadding: 8 }}
          axisLeft={{ tickSize: 0, tickPadding: 6, tickValues: 4 }}
          pointSize={6}
          useMesh
          enableArea
          areaOpacity={0.08}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              translateY: 40,
              itemWidth: 64,
              itemHeight: 16,
              symbolSize: 8,
            },
          ]}
        />
      </ChartBox>
      <ChartBox empty={empty || pieData.length === 0} pie>
        <ResponsivePie
          data={pieData}
          theme={theme}
          colors={SERIES_COLORS}
          margin={{ top: 28, right: 52, bottom: 40, left: 52 }}
          innerRadius={0.58}
          padAngle={1.4}
          cornerRadius={2}
          enableArcLabels={false}
          arcLinkLabelsSkipAngle={8}
          arcLinkLabelsDiagonalLength={10}
          arcLinkLabelsStraightLength={8}
          arcLinkLabelsTextColor="#8f877a"
          arcLinkLabelsThickness={1}
          arcLinkLabelsColor={{ from: 'color' }}
        />
      </ChartBox>
    </div>
  );
}

export function AdminHoursChart({ analytics }: { analytics: AdminAnalytics }) {
  const today = analytics.to;
  const todayLabel = dayLabel(today);
  const todayValues = Array.from({ length: 24 }, (_, hour) => {
    const row = analytics.hours.find(
      (item) => item.date === today && item.hour === hour,
    );
    return {
      hour: String(hour).padStart(2, '0'),
      로비: row?.visits ?? 0,
    };
  });
  const todayPeak = Math.max(0, ...todayValues.map((row) => row.로비));
  const heatData = [...analytics.series].reverse().map((day) => ({
    id: dayLabel(day.date),
    data: Array.from({ length: 24 }, (_, hour) => {
      const row = analytics.hours.find(
        (item) => item.date === day.date && item.hour === hour,
      );
      return { x: String(hour).padStart(2, '0'), y: row?.visits ?? 0 };
    }),
  }));
  const heatPeak = Math.max(
    0,
    ...analytics.hours.map((row) => row.visits),
  );
  const log = [...analytics.hours]
    .filter((row) => row.visits > 0)
    .sort((a, b) =>
      a.date === b.date ? b.hour - a.hour : a.date < b.date ? 1 : -1,
    );

  return (
    <div className="admin-hours-panel">
      <p className="admin-chart-label">오늘 {todayLabel} · 로비 방문</p>
      <ChartBox empty={todayPeak === 0}>
        <ResponsiveBar
          data={todayValues}
          keys={['로비']}
          indexBy="hour"
          theme={theme}
          colors={[GOLD]}
          margin={{ top: 12, right: 8, bottom: 28, left: 28 }}
          padding={0.22}
          enableLabel={false}
          borderRadius={2}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: todayValues
              .filter((_, hour) => hour % 3 === 0)
              .map((row) => row.hour),
          }}
          axisLeft={{ tickSize: 0, tickPadding: 6, tickValues: 4 }}
          enableGridX={false}
        />
      </ChartBox>
      <p className="admin-chart-label">최근 7일 시간대</p>
      <ChartBox empty={heatPeak === 0} tall>
        <ResponsiveHeatMap
          data={heatData}
          theme={theme}
          margin={{ top: 8, right: 12, bottom: 28, left: 44 }}
          forceSquare={false}
          xInnerPadding={0.06}
          yInnerPadding={0.08}
          enableLabels={false}
          emptyColor="#14161c"
          colors={{
            type: 'sequential',
            colors: ['#1c1810', GOLD],
          }}
          axisTop={null}
          axisRight={null}
          axisLeft={{ tickSize: 0, tickPadding: 8 }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: ['00', '03', '06', '09', '12', '15', '18', '21'],
          }}
          hoverTarget="cell"
        />
      </ChartBox>
      <p className="admin-chart-label">최근 7일 기록</p>
      {log.length === 0 ? (
        <p className="admin-status">방문 기록이 없어요</p>
      ) : (
        <ul className="admin-hour-log">
          {log.map((row) => (
            <li key={`${row.date}-${row.hour}`}>
              <span>
                {dayLabel(row.date)} {hourLabel(row.hour)}
              </span>
              <strong>{row.visits}명</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
