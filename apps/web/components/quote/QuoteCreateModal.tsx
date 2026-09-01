'use client';

import { useState, type CSSProperties } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Film, Plus, Search, X } from 'lucide-react';
import type { GachaMovie } from '@cinemo/shared';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import '../../app/styles/quote.css';

const quoteSchema = z.object({
  tmdbId: z.number().int().positive('영화를 먼저 선택하세요.'),
  text: z
    .string()
    .trim()
    .min(1, '명대사를 입력하세요.')
    .max(1000, '명대사는 1000자까지 입력할 수 있습니다.'),
  usePosterBackground: z.boolean(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

type QuoteCreateModalProps = {
  isOpen: boolean;
  movies: GachaMovie[];
  selectedMovie: GachaMovie | null;
  isSearching?: boolean;
  onClose: () => void;
  onSearchMovies: (query: string) => void;
  onSelectMovie: (movie: GachaMovie) => void;
  onSubmit: (input: {
    tmdbId: number;
    text: string;
    usePosterBackground: boolean;
  }) => void | Promise<void>;
};

export default function QuoteCreateModal({
  isOpen,
  movies,
  selectedMovie,
  isSearching = false,
  onClose,
  onSearchMovies,
  onSelectMovie,
  onSubmit,
}: QuoteCreateModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      tmdbId: selectedMovie?.id ?? 0,
      text: '',
      usePosterBackground: true,
    },
  });

  const poster = selectedMovie
    ? tmdbPosterUrl(selectedMovie.poster_path, 'w342')
    : null;

  const handleMovieSelect = (movie: GachaMovie) => {
    onSelectMovie(movie);

    setValue('tmdbId', movie.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSave: SubmitHandler<QuoteFormValues> = async (values) => {
    try {
      await onSubmit(values);
      reset();
      setSearchQuery('');
      onClose();
    } catch {
      setError('root.server', {
        message: '명대사를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="quote-compose-overlay"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="quote-compose-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-compose-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="quote-compose-close"
          onClick={onClose}
          aria-label="명대사 작성 닫기"
        >
          <X size={22} aria-hidden />
        </button>

        <div className="quote-compose-heading">
          <p className="quote-compose-kicker">QUOTE FILM</p>
          <h2 id="quote-compose-title">필름에 장면 남기기</h2>
          <p>좋아하는 영화의 한 문장을 기록하세요.</p>
        </div>

        <form
          className="quote-compose-form"
          onSubmit={handleSubmit(handleSave)}
        >
          <label className="quote-compose-label" htmlFor="quote-movie-search">
            영화 선택
          </label>

          <div className="quote-compose-search">
            <Search size={19} aria-hidden />

            <input
              id="quote-movie-search"
              type="search"
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                setSearchQuery(value);
                onSearchMovies(value);
              }}
              placeholder="영화 제목 검색"
              autoComplete="off"
            />
          </div>

          {isSearching && (
            <p className="quote-compose-status">영화를 찾는 중…</p>
          )}

          {movies.length > 0 && (
            <div className="quote-compose-movie-results">
              {movies.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  className={
                    selectedMovie?.id === movie.id
                      ? 'quote-compose-movie is-selected'
                      : 'quote-compose-movie'
                  }
                  onClick={() => handleMovieSelect(movie)}
                >
                  <span>{movie.title}</span>
                  <small>
                    {movie.release_date?.slice(0, 4) || '연도 없음'}
                  </small>
                </button>
              ))}
            </div>
          )}

          <div className="quote-compose-selected">
            {selectedMovie ? (
              <>
                <Film size={17} aria-hidden />
                <span>{selectedMovie.title}</span>
                <small>
                  {selectedMovie.release_date?.slice(0, 4) || '연도 없음'}
                </small>
              </>
            ) : (
              <span>먼저 영화를 선택하세요.</span>
            )}
          </div>

          {errors.tmdbId && (
            <p className="quote-compose-error" role="alert">
              {errors.tmdbId.message}
            </p>
          )}

          <label className="quote-compose-label" htmlFor="quote-text">
            명대사
          </label>

          <textarea
            id="quote-text"
            {...register('text')}
            placeholder="이 장면의 문장을 남겨보세요."
            maxLength={1000}
            rows={5}
          />

          {errors.text && (
            <p className="quote-compose-error" role="alert">
              {errors.text.message}
            </p>
          )}

          <label className="quote-compose-background">
            <input type="checkbox" {...register('usePosterBackground')} />
            <span>영화 포스터를 필름 배경으로 사용</span>
          </label>

          <div
            className="quote-compose-preview"
            style={
              poster
                ? ({
                    '--quote-preview-poster': `url("${poster}")`,
                  } as CSSProperties)
                : undefined
            }
          >
            <div className="quote-compose-preview-holes" aria-hidden>
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} />
              ))}
            </div>

            <div className="quote-compose-preview-content">
              <p>
                {selectedMovie
                  ? '명대사가 여기에 기록됩니다.'
                  : '영화를 선택하세요.'}
              </p>
              <small>{selectedMovie?.title || 'QUOTE FILM'}</small>
            </div>

            <div className="quote-compose-preview-holes" aria-hidden>
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} />
              ))}
            </div>
          </div>

          {errors.root?.server && (
            <p className="quote-compose-error" role="alert">
              {errors.root.server.message}
            </p>
          )}

          <button
            type="submit"
            className="quote-compose-submit"
            disabled={!selectedMovie || isSubmitting}
          >
            <Plus size={18} aria-hidden />
            {isSubmitting ? '필름에 기록 중…' : '필름에 남기기'}
          </button>
        </form>
      </section>
    </div>
  );
}
