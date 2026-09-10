'use client';

import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { GachaMovie } from '@cinemo/shared';
import type { CreatePostcardInput, PostcardSummary } from '@/lib/postcard-api';
import {
  recommendMovieQuotesRequest,
  type MovieQuoteSuggestion,
} from '@/lib/ai-api';
import { searchMoviesRequest } from '@/lib/tmdb-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { useAuthStore } from '@/lib/auth-store';

const postcardSchema = z.object({
  originalText: z
    .string()
    .trim()
    .max(1000, '원문은 1000자까지 입력할 수 있습니다.'),
  text: z
    .string()
    .trim()
    .min(1, '엽서 내용을 입력해 주세요.')
    .max(1000, '엽서 내용은 1000자까지 입력할 수 있습니다.'),
  isPublic: z.boolean(),
});

type PostcardFormValues = z.infer<typeof postcardSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePostcardInput) => Promise<void>;
  postcardToEdit?: PostcardSummary | null;
};

export function PostcardCreateModal({
  open,
  onClose,
  onSubmit,
  postcardToEdit,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<GachaMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<GachaMovie | null>(null);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [suggestions, setSuggestions] = useState<MovieQuoteSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostcardFormValues>({
    resolver: zodResolver(postcardSchema),
    defaultValues: {
      originalText: '',
      text: '',
      isPublic: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    setQuery(postcardToEdit?.movieTitle ?? '');
    setMovies([]);
    setSelectedMovie(null);
    setSuggestions([]);
    setServerError(null);

    reset({
      originalText: postcardToEdit?.originalText ?? '',
      text: postcardToEdit?.text ?? '',
      isPublic: postcardToEdit?.isPublic ?? true,
    });
  }, [open, reset, postcardToEdit]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const originalTextLabel =
    selectedMovie?.original_language === 'ko' ? '영화 원문' : '외국어 원문';

  async function handleSearchMovies() {
    const trimmedQuery = query.trim();
    console.log(trimmedQuery);

    if (!accessToken || !trimmedQuery || loadingMovies) return;

    try {
      setLoadingMovies(true);
      setServerError(null);

      const response = await searchMoviesRequest(accessToken, trimmedQuery);

      setMovies(response.results);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : '영화를 검색하지 못했습니다.',
      );
    } finally {
      setLoadingMovies(false);
    }
  }

  async function handleRecommendQuotes() {
    if (!accessToken || !selectedMovie || loadingSuggestions) {
      return;
    }

    try {
      setLoadingSuggestions(true);
      setServerError(null);

      const releaseYear = selectedMovie.release_date
        ? Number(selectedMovie.release_date.slice(0, 4))
        : null;

      const response = await recommendMovieQuotesRequest(accessToken, {
        tmdbId: selectedMovie.id,
        title: selectedMovie.title,
        originalTitle: selectedMovie.original_title ?? null,
        originalLanguage: selectedMovie.original_language ?? null,
        releaseYear: Number.isNaN(releaseYear) ? null : releaseYear,
        overview: selectedMovie.overview || null,
      });

      const visibleSuggestions = response.slice(0, 3);

      if (visibleSuggestions.length === 0) {
        setServerError(
          'AI가 확실한 문구를 찾지 못했습니다. 직접 입력하거나 다시 추천해 주세요.',
        );
        return;
      }

      setSuggestions(visibleSuggestions);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'AI 추천 문구를 불러오지 못했습니다.',
      );
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function handleSelectSuggestion(suggestion: MovieQuoteSuggestion) {
    setValue('originalText', suggestion.originalText, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('text', suggestion.koreanText || suggestion.originalText, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    setSuggestions([]);
  }

  async function handleCreate(values: PostcardFormValues) {
    const keepsInitialMovie =
      postcardToEdit &&
      !selectedMovie &&
      query.trim() === (postcardToEdit.movieTitle ?? '').trim();

    const movieId =
      selectedMovie?.id ?? (keepsInitialMovie ? postcardToEdit?.tmdbId : null);

    if (!movieId) {
      setServerError('영화를 선택해 주세요.');
      return;
    }

    const posterPath = selectedMovie?.poster_path
      ? tmdbPosterUrl(selectedMovie.poster_path, 'w500')
      : keepsInitialMovie
        ? (postcardToEdit?.posterPath ?? null)
        : null;

    await onSubmit({
      tmdbId: movieId,
      movieTitle: selectedMovie?.title ?? postcardToEdit?.movieTitle,
      originalText: values.originalText.trim() || null,
      posterPath,
      text: values.text,
      isPublic: values.isPublic,
    });

    onClose();
  }

  const keepsInitialMovie =
    postcardToEdit &&
    !selectedMovie &&
    query.trim() === (postcardToEdit.movieTitle ?? '').trim();

  const selectedTitle =
    selectedMovie?.title ??
    (keepsInitialMovie ? postcardToEdit?.movieTitle : null);

  const selectedPoster = selectedMovie?.poster_path
    ? tmdbPosterUrl(selectedMovie.poster_path, 'w185')
    : keepsInitialMovie
      ? (postcardToEdit?.posterPath ?? null)
      : null;

  return (
    <div
      className="postcard-create-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting &&
          !loadingMovies &&
          !loadingSuggestions
        ) {
          onClose();
        }
      }}
    >
      <section
        className="postcard-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="postcard-create-modal-header">
          <button
            type="button"
            className="postcard-create-modal-close"
            aria-label="엽서 만들기 닫기"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X size={19} aria-hidden />
          </button>

          <p className="postcard-create-modal-eyebrow">CINEMO POSTCARD</p>

          <h2 id={titleId}>기억할 문장을 적어보세요</h2>

          <p id={descriptionId}>
            영화에서 오래 남은 문장을 한 장의 엽서로 기록해요.
          </p>
        </header>

        <div className="postcard-create-modal-body">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearchMovies();
            }}
            className="postcard-create-modal-search"
          >
            <input
              type="search"
              value={query}
              placeholder="영화 제목을 검색해 주세요."
              onChange={(event) => {
                const nextQuery = event.target.value;

                setQuery(nextQuery);
                setSelectedMovie(null);
                setMovies([]);
                setSuggestions([]);
              }}
            />

            <button type="submit" disabled={loadingMovies || !query.trim()}>
              {loadingMovies ? '검색 중...' : '검색'}
            </button>
          </form>

          {movies.length > 0 ? (
            <div
              className="postcard-create-modal-movie-results"
              aria-label="영화 검색 결과"
            >
              {movies.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  className={
                    selectedMovie?.id === movie.id ? 'is-selected' : undefined
                  }
                  onClick={() => {
                    setSelectedMovie(movie);
                    setMovies([]);
                    setSuggestions([]);
                  }}
                >
                  <strong>{movie.title}</strong>
                  <small>
                    {movie.release_date?.slice(0, 4) ?? '연도 미상'}
                    {movie.original_title &&
                    movie.original_title !== movie.title
                      ? ` · ${movie.original_title}`
                      : ''}
                  </small>
                </button>
              ))}
            </div>
          ) : null}

          {selectedTitle ? (
            <div className="postcard-create-modal-movie">
              {selectedPoster ? (
                <div
                  className="postcard-create-modal-poster"
                  style={{
                    backgroundImage: `url(${selectedPoster})`,
                  }}
                  aria-label={`${selectedTitle} 포스터`}
                />
              ) : null}

              <strong>{selectedTitle}</strong>
            </div>
          ) : (
            <p className="postcard-create-modal-empty">
              먼저 영화를 검색하고 선택해 주세요.
            </p>
          )}

          <div className="postcard-create-modal-label-row">
            <label
              className="postcard-create-modal-label"
              htmlFor="postcard-text"
            >
              엽서 문구 (한글)
            </label>

            <button
              type="button"
              className="postcard-create-modal-ai-button"
              disabled={
                !selectedMovie ||
                !accessToken ||
                loadingSuggestions ||
                isSubmitting
              }
              onClick={() => void handleRecommendQuotes()}
            >
              {loadingSuggestions
                ? '추천 중...'
                : suggestions.length > 0
                  ? 'AI 문구 다시 추천'
                  : 'AI 문구 추천'}
            </button>
          </div>

          <form onSubmit={handleSubmit(handleCreate)}>
            <textarea
              id="postcard-text"
              className="postcard-create-modal-korean-text"
              maxLength={1000}
              placeholder="기억하고 싶은 문장을 적어보세요."
              aria-invalid={errors.text ? 'true' : 'false'}
              {...register('text')}
            />

            <label
              className="postcard-create-modal-label postcard-create-modal-original-label"
              htmlFor="postcard-original-text"
            >
              {originalTextLabel}
            </label>

            <textarea
              id="postcard-original-text"
              className="postcard-create-modal-original-text"
              maxLength={1000}
              placeholder="AI 문구 추천으로 원문을 불러오거나 직접 적어보세요."
              aria-invalid={errors.originalText ? 'true' : 'false'}
              {...register('originalText')}
            />

            {errors.text ? (
              <p className="postcard-create-modal-error" role="alert">
                {errors.text.message}
              </p>
            ) : null}

            {suggestions.length > 0 ? (
              <div
                className="postcard-create-modal-suggestions"
                aria-label="AI 추천 문구"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.originalText}-${index}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <span>
                      <strong>엽서 문구</strong>
                      {suggestion.koreanText}
                    </span>
                    <small>
                      <b>{originalTextLabel}</b>
                      {suggestion.originalText}
                    </small>
                  </button>
                ))}
              </div>
            ) : null}

            <label className="postcard-create-modal-public">
              <input
                type="checkbox"
                className="postcard-create-modal-public-input"
                {...register('isPublic')}
              />
              <span
                className="postcard-create-modal-public-switch"
                aria-hidden="true"
              />
              <span className="postcard-create-modal-public-copy">
                <strong>공개 엽서</strong>
                <small>다른 사람에게도 보여요</small>
              </span>
            </label>

            {serverError ? (
              <p className="postcard-create-modal-error" role="alert">
                {serverError}
              </p>
            ) : null}

            <div className="postcard-create-modal-actions">
              <button type="submit" disabled={isSubmitting || !selectedTitle}>
                {isSubmitting
                  ? '저장 중...'
                  : postcardToEdit
                    ? '엽서 수정'
                    : '엽서 만들기'}
              </button>
              <button type="button" disabled={isSubmitting} onClick={onClose}>
                취소
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
