'use client';

import * as Tabs from '@radix-ui/react-tabs';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Minus, Play } from 'lucide-react';
import type {
  MovieChartHistoryResponse,
  MovieChartItem,
  MovieDetail,
} from '@cinemo/api-contract';
import { MovieChartHistoryChart } from '@/components/moviechart/MovieChartHistoryChart';
import { MovieChartHistorySkeleton } from '@/components/moviechart/MovieChartHistorySkeleton';
import { formatAudienceCount } from '@/lib/format-audience';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

type MovieChartContentTabsProps = {
  movies: MovieChartItem[];
  history: MovieChartHistoryResponse;
  historyLoading: boolean;
  historyError: string | null;
  loadingDetailId: number | null;
  onSelectTrailer: (movie: MovieChartItem) => void;
  onSelectDetail: (tmdbId: number) => void;
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

function getReleaseDayLabel(
  releaseDate: string | null,
  reReleaseDates: string[],
  todayKst: string,
) {
  const releaseDates = [releaseDate, ...reReleaseDates]
    .filter((date): date is string => Boolean(date))
    .sort();

  if (releaseDates.length === 0) return '개봉일 확인 중';

  const currentReleaseDate =
    releaseDates.filter((date) => date <= todayKst).at(-1) ?? releaseDates[0];

  const release = new Date(`${currentReleaseDate}T00:00:00+09:00`);
  const target = new Date(`${todayKst}T00:00:00+09:00`);
  const days = Math.floor((target.getTime() - release.getTime()) / 86_400_000);

  if (days < 0) return '개봉 예정';
  if (days === 0) return '오늘 개봉';
  return `개봉 ${days + 1}일차`;
}

function getTodayKst() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
}

export function MovieChartContentTabs({
  movies,
  history,
  historyLoading,
  historyError,
  loadingDetailId,
  onSelectTrailer,
  onSelectDetail,
}: MovieChartContentTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTab =
    searchParams.get('tab') === 'trend' ? 'trend' : 'rankings';
  const todayKst = getTodayKst();

  const handleTabChange = (value: string) => {
    if (value === selectedTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <section className="movie-chart-content" aria-label="영화 차트 콘텐츠">
      <Tabs.Root
        className="movie-chart-tabs-root"
        onValueChange={handleTabChange}
        value={selectedTab}
      >
        <Tabs.List className="movie-chart-tabs" aria-label="차트 보기">
          <Tabs.Trigger className="movie-chart-tab" value="rankings">
            현재 순위
          </Tabs.Trigger>
          <Tabs.Trigger className="movie-chart-tab" value="trend">
            순위 흐름
          </Tabs.Trigger>
          <Tabs.Trigger
            className="movie-chart-tab"
            value="monthly"
            disabled
            aria-label="월간 비교 준비 중"
          >
            월간 비교
            <span className="movie-chart-tab-status">준비 중</span>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="movie-chart-tab-panel" value="rankings">
          <ol className="movie-chart-list">
            {movies.map((movie) => {
              console.log(movie);
              const poster = tmdbPosterUrl(movie.posterPath, 'w342');
              const tmdbId = movie.tmdbId;

              const releaseDayLabel = getReleaseDayLabel(
                movie.releaseDate,
                movie.reReleaseDates,
                todayKst,
              );

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
                    <p className="movie-chart-release-day">{releaseDayLabel}</p>
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
                        <Play size={14} aria-hidden />
                        예고편
                      </button>
                    ) : null}

                    {tmdbId !== null ? (
                      <button
                        type="button"
                        className="movie-chart-detail-button"
                        onClick={() => onSelectDetail(tmdbId)}
                        disabled={loadingDetailId === tmdbId}
                      >
                        {loadingDetailId === tmdbId
                          ? '불러오는 중...'
                          : '상세 보기'}
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
          ) : historyError || history.length === 0 ? null : (
            <MovieChartHistoryChart history={history} />
          )}
        </Tabs.Content>
        {/* <Tabs.Content className="movie-chart-tab-panel" value="monthly">
          <h2>월간 비교를 준비 중이에요</h2>
          <p>일별 데이터가 충분히 쌓이면 월별 영화 흐름을 비교할 수 있어요</p>
        </Tabs.Content> */}
      </Tabs.Root>
    </section>
  );
}
