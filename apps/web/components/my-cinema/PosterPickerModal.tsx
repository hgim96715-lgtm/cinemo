'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import type { MovieSearchItem } from '@cinemo/api-contract';
import { searchMoviesRequest } from '@/lib/tmdb-api';
import { normalizeSearchQuery } from '@/lib/search-query';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { LoaderCircle, X } from 'lucide-react';
import { useDialogFocusRestore } from '@/hooks/common/useDialogFocusRestore';

type PosterPickerModalProps = {
  token: string;
  onSelect: (movie: MovieSearchItem) => void;
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
  const { handleOpenAutoFocus, handleCloseAutoFocus } = useDialogFocusRestore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchItem[]>([]);
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
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="poster-picker-overlay" />
        <Dialog.Content
          className="poster-picker-modal"
          aria-busy={isPending}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
          onEscapeKeyDown={(event) => {
            if (isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <Dialog.Close asChild>
            <button
              type="button"
              className="poster-picker-close"
              disabled={isPending}
              aria-label="포스터 검색 닫기"
            >
              <X size={22} />
            </button>
          </Dialog.Close>

          <p className="movie-detail-kicker">WATCHED RECORD</p>
          <Dialog.Title asChild>
            <h2>영화 포스터 고르기</h2>
          </Dialog.Title>

          <div className="poster-picker-search">
            <input
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="영화 제목을 검색하세요"
              autoFocus
              disabled={isPending}
            />

            {query ? (
              <button
                type="button"
                className="poster-picker-search-clear"
                onClick={() => handleQueryChange('')}
                disabled={isPending}
                aria-label="영화 검색어 지우기"
              >
                <X size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : null}
          </div>

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
                const poster = tmdbPosterUrl(movie.poster_path, 'w342');

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
                        priority
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
