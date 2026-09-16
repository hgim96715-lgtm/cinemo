'use client';

import { useMemo, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { MovieChartHistoryResponse } from '@cinemo/api-contract';
import { formatAudienceCount } from '@/lib/format-audience';
import { formatKstMonthDay } from '@/lib/date-kst';

type MovieChartHistoryChartProps = {
  history: MovieChartHistoryResponse;
};

type ChartMetric = 'rank' | 'dailyAudience';

function isChartMetric(value: string): value is ChartMetric {
  return value === 'rank' || value === 'dailyAudience';
}

type MovieChartPoint = {
  x: string;
  y: number;
  rank: number;
  audienceCount: number;
  dailyAudienceCount: number;
};

type MovieChartDataPoint = Omit<MovieChartPoint, 'x'> & {
  x: number;
  chartDate: string;
};

function formatChartDate(dateKey: string) {
  return formatKstMonthDay(`${dateKey}T00:00:00+09:00`).replace('.', '/');
}

function getMaxPointY<T extends { y: number }>(points: readonly T[]) {
  return points.reduce((max, point) => Math.max(max, point.y), -Infinity);
}

function getMinPointY<T extends { y: number }>(points: readonly T[]) {
  return points.reduce((min, point) => Math.min(min, point.y), Infinity);
}

export function MovieChartHistoryChart({
  history,
}: MovieChartHistoryChartProps) {
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('rank');
  const [selectedPoint, setSelectedPoint] = useState<MovieChartPoint | null>(
    null,
  );

  const handleMetricChange = (value: string) => {
    if (isChartMetric(value)) {
      setChartMetric(value);
    }
  };

  const latestChartDate = useMemo(
    () =>
      history.reduce((latest, item) => {
        const chartDate = item.chartDate.slice(0, 10);
        return chartDate > latest ? chartDate : latest;
      }, ''),
    [history],
  );

  const historyLineData = useMemo(() => {
    const movieMap = new Map<
      string,
      {
        id: string;
        data: MovieChartPoint[];
      }
    >();

    for (const item of history) {
      const current = movieMap.get(item.kobisMovieCd) ?? {
        id: item.title,
        data: [],
      };

      current.data.push({
        x: item.chartDate.slice(0, 10),
        y: item.rank,
        rank: item.rank,
        audienceCount: item.audienceCount,
        dailyAudienceCount: item.dailyAudienceCount,
      });

      movieMap.set(item.kobisMovieCd, current);
    }

    return [...movieMap.values()]
      .map((series) => ({
        ...series,
        data: [...series.data].sort((a, b) => a.x.localeCompare(b.x)),
      }))
      .filter(
        (series) => series.data[series.data.length - 1]?.x === latestChartDate,
      )
      .sort(
        (a, b) =>
          (a.data[a.data.length - 1]?.y ?? Infinity) -
          (b.data[b.data.length - 1]?.y ?? Infinity),
      )
      .slice(0, 5);
  }, [history]);

  const defaultSeries = historyLineData.reduce((best, series) => {
    const bestRange = getMaxPointY(best.data) - getMinPointY(best.data);
    const seriesRange = getMaxPointY(series.data) - getMinPointY(series.data);

    return seriesRange > bestRange ? series : best;
  }, historyLineData[0]);

  const selectedSeries =
    historyLineData.find((series) => series.id === selectedMovieId) ??
    defaultSeries;

  if (!selectedSeries) return null;

  const first = selectedSeries.data[0];
  const last = selectedSeries.data[selectedSeries.data.length - 1];

  if (!first || !last) return null;

  const rankChange = first.y - last.y;
  const isStale = last.x !== latestChartDate;
  const maxRank = Math.max(5, getMaxPointY(selectedSeries.data));
  const chartData: {
    id: string;
    data: MovieChartDataPoint[];
  } = {
    ...selectedSeries,
    data: selectedSeries.data.map((point, index) => ({
      ...point,
      x: index,
      chartDate: point.x,
      y: chartMetric === 'rank' ? point.rank : point.dailyAudienceCount,
    })),
  };
  const chartMax =
    chartMetric === 'rank'
      ? maxRank + 0.5
      : Math.max(getMaxPointY(chartData.data), 1);
  const activePoint =
    chartData.data.find((point) => point.chartDate === selectedPoint?.x) ??
    chartData.data[chartData.data.length - 1];
  const hasSelectedPoint = chartData.data.some(
    (point) => point.chartDate === selectedPoint?.x,
  );
  const xTickCount = Math.min(chartData.data.length, 6);
  const xTickValues = Array.from({ length: xTickCount }, (_, index) => {
    const pointIndex =
      xTickCount === 1
        ? 0
        : Math.round((index * (chartData.data.length - 1)) / (xTickCount - 1));

    return chartData.data[pointIndex]?.x;
  }).filter((value): value is number => value !== undefined);

  return (
    <section
      className="movie-chart-stats"
      aria-labelledby="movie-chart-stats-title"
    >
      <header className="movie-chart-stats-header">
        <div>
          <span className="movie-chart-stats-kicker">
            {chartMetric === 'rank' ? '이번 달 순위 흐름' : '이번 달 관객 흐름'}
          </span>
          <h2 id="movie-chart-stats-title">{selectedSeries.id}</h2>
        </div>

        <div
          className="movie-chart-stats-summary"
          aria-label="선택한 영화 요약"
        >
          <strong>{last.y}위</strong>
          <span
            className={
              rankChange > 0 ? 'is-up' : rankChange < 0 ? 'is-down' : 'is-same'
            }
          >
            {rankChange > 0 ? (
              <>
                <ArrowUp size={14} aria-hidden /> {rankChange}위 상승
              </>
            ) : rankChange < 0 ? (
              <>
                <ArrowDown size={14} aria-hidden /> {Math.abs(rankChange)}위
                하락
              </>
            ) : (
              '변동 없음'
            )}
          </span>
          <span>
            {isStale
              ? `최근 기록 ${formatChartDate(last.x)}`
              : `누적 ${formatAudienceCount(last.audienceCount)}`}
          </span>
        </div>
      </header>

      <div
        className="movie-chart-period-summary"
        role="tablist"
        aria-label="차트를 볼 영화 선택"
      >
        {historyLineData.map((series) => {
          const last = series.data[series.data.length - 1];

          if (!last) return null;

          return (
            <button
              type="button"
              className="movie-chart-period-summary-card"
              key={series.id}
              role="tab"
              aria-selected={series.id === selectedSeries.id}
              onClick={() => setSelectedMovieId(series.id)}
            >
              <h3>{series.id}</h3>
              <span>{last.y}위</span>
            </button>
          );
        })}
      </div>

      <Tabs.Root
        className="movie-chart-metric-tabs-root"
        value={chartMetric}
        onValueChange={handleMetricChange}
      >
        <div className="movie-chart-detail-heading">
          <h3>날짜별 흐름</h3>
          <Tabs.List
            className="movie-chart-metric-tabs"
            aria-label="차트 지표 선택"
          >
            <Tabs.Trigger value="rank">순위 흐름</Tabs.Trigger>
            <Tabs.Trigger value="dailyAudience">일일 관객</Tabs.Trigger>
          </Tabs.List>
        </div>

        <Tabs.Content value={chartMetric} className="movie-chart-stats-chart">
          <ResponsiveLine
            data={[chartData]}
            ariaLabel={
              chartMetric === 'rank'
                ? '이번 달 영화 순위 흐름 차트'
                : '이번 달 일일 관객 흐름 차트'
            }
            role="img"
            pointAriaLabel={(point) =>
              `${point.seriesId}, ${point.data.xFormatted}, ${point.data.yFormatted}`
            }
            margin={{
              top: 20,
              right: 16,
              bottom: 54,
              left: chartMetric === 'rank' ? 32 : 44,
            }}
            xScale={{
              type: 'linear',
              min: -0.5,
              max: chartData.data.length - 0.5,
            }}
            xFormat={(value) => {
              const point = chartData.data[Number(value)];
              return point ? formatChartDate(point.chartDate) : String(value);
            }}
            yScale={{
              type: 'linear',
              min: chartMetric === 'rank' ? 1 : 0,
              max: chartMax,
              reverse: chartMetric === 'rank',
            }}
            yFormat={(value) =>
              chartMetric === 'rank'
                ? `${value}위`
                : formatAudienceCount(Number(value))
            }
            curve="monotoneX"
            colors={['#c8a96b']}
            lineWidth={3}
            pointSize={7}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={(point) => point.seriesColor}
            onClick={(pointOrSlice) => {
              const point =
                'points' in pointOrSlice
                  ? pointOrSlice.points[0]
                  : pointOrSlice;

              if (!point) return;

              const data = point.data;
              setSelectedPoint({
                x: String(data.chartDate),
                y: Number(data.y),
                rank: Number(data.rank),
                audienceCount: Number(data.audienceCount),
                dailyAudienceCount: Number(data.dailyAudienceCount),
              });
            }}
            enableGridX={false}
            enableSlices="x"
            sliceTooltip={({ slice }) => (
              <div className="movie-chart-tooltip">
                <strong>{slice.points[0]?.data.xFormatted}</strong>
                {slice.points.map((point) => (
                  <div key={point.id}>
                    <strong className="movie-chart-tooltip-movie">
                      {point.seriesId}
                    </strong>
                    <dl>
                      <div>
                        <dt>순위</dt>
                        <dd>{point.data.rank}위</dd>
                      </div>
                      <div>
                        <dt>누적 관객</dt>
                        <dd>
                          {point.data.audienceCount.toLocaleString('ko-KR')}명
                        </dd>
                      </div>
                      <div>
                        <dt>일일 관객</dt>
                        <dd>
                          {point.data.dailyAudienceCount === 0
                            ? '없음'
                            : `${point.data.dailyAudienceCount.toLocaleString('ko-KR')}명`}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
            useMesh
            axisBottom={{
              tickValues: xTickValues,
              tickRotation: 0,
              tickSize: 0,
              tickPadding: 16,
              format: (value) => {
                const point = chartData.data[Number(value)];
                return point ? formatChartDate(point.chartDate) : '';
              },
            }}
            axisLeft={{
              tickValues: 5,
              tickSize: 0,
              tickPadding: 8,
              format: (value) =>
                chartMetric === 'rank'
                  ? `${value}위`
                  : formatAudienceCount(Number(value)),
            }}
            theme={{
              text: {
                fill: 'var(--cinemo-fg)',
              },
              axis: {
                ticks: {
                  text: {
                    fill: 'var(--cinemo-muted)',
                  },
                },
              },
              grid: {
                line: {
                  stroke: 'var(--cinemo-border)',
                },
              },
              crosshair: {
                line: {
                  stroke: 'var(--cinemo-fg)',
                  strokeWidth: 1,
                  strokeOpacity: 0.5,
                },
              },
            }}
          />
        </Tabs.Content>
      </Tabs.Root>

      <article
        className="movie-chart-mobile-detail"
        aria-label="선택한 날짜의 차트 정보"
      >
        <div className="movie-chart-mobile-detail-heading">
          <span>{hasSelectedPoint ? '선택한 날짜' : '최근 기록'}</span>
          <strong>{formatChartDate(activePoint.chartDate)}</strong>
        </div>
        <dl>
          <div>
            <dt>순위</dt>
            <dd>{activePoint.rank}위</dd>
          </div>
          <div>
            <dt>누적 관객</dt>
            <dd>{activePoint.audienceCount.toLocaleString('ko-KR')}명</dd>
          </div>
          <div>
            <dt>일일 관객</dt>
            <dd>
              {activePoint.dailyAudienceCount === 0
                ? '없음'
                : `${activePoint.dailyAudienceCount.toLocaleString('ko-KR')}명`}
            </dd>
          </div>
        </dl>
      </article>
    </section>
  );
}
