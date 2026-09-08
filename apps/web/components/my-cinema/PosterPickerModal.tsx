'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { GachaMovie } from '@cinemo/shared';
import { searchMoviesRequest } from '@/lib/tmdb-api';
import { normalizeSearchQuery } from '@/lib/search-query';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { LoaderCircle, X } from 'lucide-react';

type PosterPickerModalProps = {
  token: string;
  onSelect: (movie: GachaMovie) => void;
  onClose: () => void;
  onRemove?: () => void;
  isPending?: boolean;
};

export function PosterPickerModal({
  token,
  onSelect,
  onClose,
  onRemove,
  isPending = false,
}: PosterPickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GachaMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const normalizedQuery = normalizeSearchQuery(query);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchMoviesRequest(token, normalizedQuery);
        if (!cancelled) setResults(response.results.slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery, token]);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (normalizeSearchQuery(value).length < 2) {
      setResults([]);
      setLoading(false);
    }
  }

  return (
    <div
      className="poster-picker-overlay"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="poster-picker-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="poster-picker-title"
        aria-busy={isPending}
      >
        <button
          type="button"
          className="poster-picker-close"
          onClick={onClose}
          disabled={isPending}
          aria-label="포스터 검색 닫기"
        >
          <X size={22} />
        </button>

        <p className="my-cinema-kicker">POSTER WALL</p>
        <h2 id="poster-picker-title">영화 포스터 고르기</h2>

        <input
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="영화 제목을 검색하세요"
          autoFocus
          disabled={isPending}
        />

        {isPending || (loading && normalizedQuery.length >= 2) ? (
          <p
            className="poster-picker-message poster-picker-message--loading"
            role="status"
          >
            <LoaderCircle
              className="poster-picker-spinner"
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span>
              {isPending ? '관람 기록을 저장하는 중…' : '영화를 찾는 중…'}
            </span>
          </p>
        ) : results.length === 0 ? (
          <p className="poster-picker-message">
            두 글자 이상 입력하면 영화를 검색할 수 있어요.
          </p>
        ) : (
          <div className="poster-picker-results">
            {results.map((movie) => {
              const poster = tmdbPosterUrl(movie.poster_path, 'w185');

              return (
                <button
                  key={movie.id}
                  type="button"
                  className="poster-picker-result"
                  onClick={() => void onSelect(movie)}
                  disabled={isPending}
                >
                  {poster ? (
                    <Image
                      src={poster}
                      alt={movie.title}
                      width={185}
                      height={278}
                      loading="lazy"
                    />
                  ) : (
                    <span className="poster-picker-empty">NO POSTER</span>
                  )}

                  <span>
                    <strong>{movie.title}</strong>
                    <small>
                      {movie.release_date?.slice(0, 4) || '연도 없음'}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {onRemove ? (
          <button
            type="button"
            className="poster-picker-remove"
            onClick={onRemove}
            disabled={isPending}
          >
            이 포스터 전시 해제
          </button>
        ) : null}
      </section>
    </div>
  );
}
