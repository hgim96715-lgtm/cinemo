'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Minus, Play } from 'lucide-react';
import { CinemoNav } from '@/components/common/CinemoNav';
import { MovieChartTrailerModal } from '@/components/moviechart/MovieChartTrailerModal';
import {
  getMovieChartRequest,
  type MovieChartItem,
} from '@/lib/lobby-board-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import '../styles/common.css';
import '../styles/moviechart.css';
import '../styles/moviechart-modal.css';

function formatAudience(count: number) {
  if (count >= 10_000) {
    return `${(count / 10_000).toLocaleString('ko-KR', {
      maximumFractionDigits: 1,
    })}만 명`;
  }

  return `${count.toLocaleString('ko-KR')}명`;
}

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

export default function MovieChartPage() {
  const [movies, setMovies] = useState<MovieChartItem[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<MovieChartItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMovieChart() {
      try {
        const response = await getMovieChartRequest();

        if (!cancelled) {
          setMovies(response.items);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '영화 차트를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMovieChart();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="movie-chart-page">
      <CinemoNav
        showRightLink
        rightHref="/postcard"
        rightLabel="POSTCARD"
        rightAriaLabel="CINEMO 엽서로 이동"
      />

      <header className="movie-chart-header">
        <span className="movie-chart-kicker">MOVIE CHART</span>
        <h1>오늘의 영화 순위</h1>
        <p>누적 관객수와 전일 대비 순위를 확인해보세요.</p>
      </header>

      {loading ? <p>영화 차트를 불러오는 중...</p> : null}
      {error ? <p>{error}</p> : null}

      {!loading && !error ? (
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
                  <p>누적 관객수 {formatAudience(movie.audienceCount)}</p>
                  <p>일일 관객수 {formatAudience(movie.dailyAudienceCount)}</p>

                  {movie.trailerUrl ? (
                    <button
                      type="button"
                      className="movie-chart-trailer-button"
                      onClick={() => setSelectedTrailer(movie)}
                    >
                      <Play size={14} fill="currentColor" aria-hidden />
                      {movie.videoType === 'teaser' ? '티저' : '예고편'}
                    </button>
                  ) : null}
                </div>

                <RankChange value={movie.rankChange} />
              </li>
            );
          })}
        </ol>
      ) : null}

      {selectedTrailer ? (
        <MovieChartTrailerModal
          movie={selectedTrailer}
          onClose={() => setSelectedTrailer(null)}
        />
      ) : null}
    </main>
  );
}
