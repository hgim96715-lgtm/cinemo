'use client';

import { useMemo, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { MovieChartHistoryResponse } from '@cinemo/api-contract';
import { formatAudienceCount } from '@/lib/format-audience';
import { formatKstMonthDay } from '@/lib/date-kst';

type MovieChartHistoryChartProps = {
  history: MovieChartHistoryResponse;
};

type ChartMetric = 'rank' | 'dailyAudience';

type MovieChartPoint = {
  x: string;
  y: number;
  rank: number;
  audienceCount: number;
  dailyAudienceCount: number;
};

function formatChartDate(dateKey: string) {
  return formatKstMonthDay(`${dateKey}T00:00:00+09:00`).replace('.', '/');
}

function getMaxPointY(points: readonly MovieChartPoint[]) {
  return points.reduce((max, point) => Math.max(max, point.y), -Infinity);
}

function getMinPointY(points: readonly MovieChartPoint[]) {
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

  const latestChartDate = useMemo(
    () =>
      history.reduce(
        (latest, item) => {
          const chartDate = item.chartDate.slice(0, 10);
          return chartDate > latest ? chartDate : latest;
        },
        '',
      ),
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
  const chartData = {
    ...selectedSeries,
    data: selectedSeries.data.map((point) => ({
      ...point,
      y:
        chartMetric === 'rank' ? point.rank : point.dailyAudienceCount,
    })),
  };
  const chartMax =
    chartMetric === 'rank'
      ? maxRank
      : Math.max(getMaxPointY(chartData.data), 1);
  const activePoint =
    chartData.data.find((point) => point.x === selectedPoint?.x) ?? last;
  const hasSelectedPoint = chartData.data.some(
    (point) => point.x === selectedPoint?.x,
  );
  const tickStep = Math.max(1, Math.ceil((chartData.data.length - 1) / 6));
  const xTickValues = chartData.data
    .filter(
      (_, index) =>
        index % tickStep === 0 || index === chartData.data.length - 1,
    )
    .map((point) => point.x);

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

        <div className="movie-chart-stats-summary" aria-label="선택한 영화 요약">
          <strong>{last.y}위</strong>
          <span
            className={
              rankChange > 0
                ? 'is-up'
                : rankChange < 0
                  ? 'is-down'
                  : 'is-same'
            }
          >
            {rankChange > 0 ? (
              <>
                <ArrowUp size={14} aria-hidden /> {rankChange}위 상승
              </>
            ) : rankChange < 0 ? (
              <>
                <ArrowDown size={14} aria-hidden /> {Math.abs(rankChange)}위 하락
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

      <div className="movie-chart-detail-heading">
        <h3>자세한 차트</h3>
        <div
          className="movie-chart-metric-tabs"
          role="tablist"
          aria-label="차트 지표 선택"
        >
          <button
            type="button"
            role="tab"
            aria-selected={chartMetric === 'rank'}
            onClick={() => setChartMetric('rank')}
          >
            순위 흐름
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chartMetric === 'dailyAudience'}
            onClick={() => setChartMetric('dailyAudience')}
          >
            일일 관객
          </button>
        </div>
      </div>

      <div className="movie-chart-stats-chart">
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
            bottom: 35,
            left: chartMetric === 'rank' ? 44 : 56,
          }}
          xScale={{ type: 'point' }}
          xFormat={(value) => {
            const [, month, day] = String(value).split('-');
            return `${month}/${day}`;
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
              x: String(data.x),
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
            tickRotation: -35,
            tickSize: 0,
            tickPadding: 6,
            format: (value) => String(value).slice(5).replace('-', '/'),
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
      </div>

      <article
        className="movie-chart-mobile-detail"
        aria-label="선택한 날짜의 차트 정보"
      >
        <div className="movie-chart-mobile-detail-heading">
          <span>{hasSelectedPoint ? '선택한 날짜' : '최근 기록'}</span>
          <strong>{formatChartDate(activePoint.x)}</strong>
        </div>
        <dl>
          <div>
            <dt>순위</dt>
            <dd>{activePoint.rank}위</dd>
          </div>
          <div>
            <dt>누적 관객</dt>
            <dd>
              {activePoint.audienceCount.toLocaleString('ko-KR')}명
            </dd>
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
