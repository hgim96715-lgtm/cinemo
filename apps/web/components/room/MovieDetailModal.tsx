'use client';

import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import type { GachaMovie } from '@cinemo/shared';
import { tmdbPosterUrl } from '@/lib/tmdb-image';

type MovieDetailModalProps = {
  movie: GachaMovie;
  onClose: () => void;
};

export function MovieDetailModal({ movie, onClose }: MovieDetailModalProps) {
  const [largeText, setLargeText] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const poster = tmdbPosterUrl(movie.poster_path, 'w342');
  return (
    <div className="movie-detail-overlay" role="presentation" onClick={onClose}>
      <section
        className={`movie-detail-modal${largeText ? ' is-large-text' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="movie-detail-close"
          onClick={onClose}
          aria-label="상세 설명 닫기"
        >
          <X size={22} strokeWidth={1.5} aria-hidden />
        </button>

        <div className="movie-detail-content">
          <div className="movie-detail-poster">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={`${movie.title} 포스터`} />
            ) : (
              <span>포스터 없음</span>
            )}
          </div>

          <div className="movie-detail-info">
            <p className="movie-detail-kicker">MOVIE DETAIL</p>

            <h2 id="movie-detail-title">{movie.title}</h2>

            <p className="movie-detail-meta">
              {movie.release_date?.slice(0, 4) || '개봉연도 정보 없음'}
              {movie.director ? ` · 감독 ${movie.director}` : ''}
            </p>

            <p className="movie-detail-overview">
              {movie.overview?.trim() || '줄거리 정보가 없어요.'}
            </p>

            <div className="movie-detail-text-controls">
              <span>설명 글자 크기</span>

              <button
                type="button"
                onClick={() => setLargeText(false)}
                aria-label="설명 글자 작게"
                aria-pressed={!largeText}
              >
                <ZoomOut size={16} strokeWidth={1.5} aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => setLargeText(true)}
                aria-label="설명 글자 크게"
                aria-pressed={largeText}
              >
                <ZoomIn size={16} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
