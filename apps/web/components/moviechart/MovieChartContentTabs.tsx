'use client';

import * as Tabs from '@radix-ui/react-tabs';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Minus, Play } from 'lucide-react';
import type {
  MovieChartHistoryResponse,
  MovieChartItem,
} from '@cinemo/api-contract';
import { MovieChartHistoryChart } from '@/components/moviechart/MovieChartHistoryChart';
import { MovieChartHistorySkeleton } from '@/components/moviechart/MovieChartHistorySkeleton';
import { formatAudienceCount } from '@/lib/format-audience';
import { tmdbPosterUrl } from '@/lib/tmdb-image';

type MovieChartContentTabsProps = {
  movies: MovieChartItem[];
  history: MovieChartHistoryResponse;
  historyLoading: boolean;
  historyError: string | null;
  onSelectTrailer: (movie: MovieChartItem) => void;
};

function RankChange({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="movie-chart-new">NEW</span>;
  }

  if (value > 0) {
    return (
      <span className="movie-chart-up">
        <ArrowUp size={14} aria-hidden />
        {value}
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="movie-chart-down">
        <ArrowDown size={14} aria-hidden />
        {Math.abs(value)}
      </span>
    );
  }

  return (
    <span className="movie-chart-same">
      <Minus size={14} aria-hidden />
    </span>
  );
}

export function MovieChartContentTabs({
  movies,
  history,
  historyLoading,
  historyError,
  onSelectTrailer,
}: MovieChartContentTabsProps) {
  return (
    <section className="movie-chart-content" aria-label="영화 차트 콘텐츠">
      <Tabs.Root className="movie-chart-tabs-root" defaultValue="rankings">
        <Tabs.List className="movie-chart-tabs" aria-label="차트 보기">
          <Tabs.Trigger className="movie-chart-tab" value="rankings">
            현재 순위
          </Tabs.Trigger>
          <Tabs.Trigger className="movie-chart-tab" value="trend">
            순위 흐름
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="movie-chart-tab-panel" value="rankings">
          <ol className="movie-chart-list">
            {movies.map((movie) => {
              const poster = tmdbPosterUrl(movie.posterPath, 'w342');

              return (
                <li className="movie-chart-item" key={movie.kobisMovieCd}>
                  <span className="movie-chart-rank">{movie.rank}</span>

                  {poster ? (
                    <Image
                      src={poster}
                      alt={`${movie.title} 포스터`}
                      width={96}
                      height={144}
                      className="movie-chart-poster"
                      priority={movie.rank === 1}
                    />
                  ) : (
                    <div className="movie-chart-poster movie-chart-poster--empty" />
                  )}

                  <div className="movie-chart-info">
                    <h2>{movie.title}</h2>

                    <dl className="movie-chart-audience">
                      <div>
                        <dt>
                          <span className="movie-chart-audience-label">
                            누적 관객 수
                          </span>
                          <span className="movie-chart-audience-label-mobile">
                            누적
                          </span>
                        </dt>
                        <dd>
                          <strong>
                            {formatAudienceCount(movie.audienceCount)}
                          </strong>
                        </dd>
                      </div>
                      <div>
                        <dt>
                          <span className="movie-chart-audience-label">
                            일일 관객 수
                          </span>
                          <span className="movie-chart-audience-label-mobile">
                            일일
                          </span>
                        </dt>
                        <dd>
                          <strong>
                            {formatAudienceCount(movie.dailyAudienceCount)}
                          </strong>
                        </dd>
                      </div>
                    </dl>

                    <dl className="movie-chart-rank-change">
                      <dt>전일 대비</dt>
                      <dd>
                        <RankChange value={movie.rankChange} />
                      </dd>
                    </dl>

                    {movie.trailerUrl ? (
                      <button
                        type="button"
                        className="movie-chart-trailer-button"
                        onClick={() => onSelectTrailer(movie)}
                      >
                        <Play size={14} fill="currentColor" aria-hidden />
                        {movie.videoType === 'teaser' ? '티저' : '예고편'}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </Tabs.Content>

        <Tabs.Content className="movie-chart-tab-panel" value="trend">
          {historyLoading ? (
            <MovieChartHistorySkeleton />
          ) : historyError ? (
            <p className="movie-chart-stats-error" role="alert">
              {historyError}
            </p>
          ) : history.length === 0 ? (
            <p className="movie-chart-stats-empty" role="status">
              표시할 차트 데이터가 없습니다.
            </p>
          ) : (
            <MovieChartHistoryChart history={history} />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
