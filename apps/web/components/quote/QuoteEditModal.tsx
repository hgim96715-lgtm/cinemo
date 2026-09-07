'use client';

import { useEffect, type CSSProperties } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Film, Save, X } from 'lucide-react';
import type { QuotePostItem } from '@cinemo/shared';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import '../../app/styles/quote.css';
import type { MovieQuoteSuggestion } from '@/lib/ai-api';

const quoteEditSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, '명대사를 입력하세요.')
    .max(1000, '명대사는 1000자까지 입력할 수 있습니다.'),
  originalText: z.string().nullable().optional(),
  originalLanguage: z.string().nullable().optional(),
  usePosterBackground: z.boolean(),
});

type QuoteEditFormValues = z.infer<typeof quoteEditSchema>;

type QuoteEditModalProps = {
  isOpen: boolean;
  quote: QuotePostItem | null;
  onClose: () => void;
  onSubmit: (input: {
    text: string;
    originalText: string | null;
    originalLanguage: string | null;
    usePosterBackground: boolean;
  }) => void | Promise<void>;
  quoteSuggestions: MovieQuoteSuggestion[];
  isRecommendingQuotes: boolean;
  quoteSuggestionError: string | null;
  onRecommendQuotes: () => void | Promise<void>;
};

export default function QuoteEditModal({
  isOpen,
  quote,
  onClose,
  onSubmit,
  quoteSuggestions,
  isRecommendingQuotes,
  quoteSuggestionError,
  onRecommendQuotes,
}: QuoteEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuoteEditFormValues>({
    resolver: zodResolver(quoteEditSchema),
    defaultValues: {
      text: '',
      originalText: null,
      originalLanguage: null,
      usePosterBackground: true,
    },
  });

  useEffect(() => {
    if (!quote || !isOpen) {
      return;
    }

    reset({
      text: quote.text,
      originalText: quote.originalText ?? null,
      originalLanguage: quote.originalLanguage ?? null,
      usePosterBackground: quote.usePosterBackground,
    });
  }, [quote, isOpen, reset]);

  const handleSave: SubmitHandler<QuoteEditFormValues> = async (values) => {
    try {
      await onSubmit({
        text: values.text.trim(),
        originalText: values.originalText?.trim() || null,
        originalLanguage: values.originalLanguage?.trim() || null,
        usePosterBackground: values.usePosterBackground,
      });
      onClose();
    } catch {
      setError('root.server', {
        message: '명대사를 수정하지 못했어요. 잠시 후 다시 시도해주세요.',
      });
    }
  };

  if (!isOpen || !quote) {
    return null;
  }

  const poster = quote.movie?.poster_path
    ? tmdbPosterUrl(quote.movie.poster_path, 'w342')
    : null;

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
        aria-labelledby="quote-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="quote-compose-close"
          onClick={onClose}
          aria-label="명대사 수정 닫기"
        >
          <X size={22} aria-hidden />
        </button>

        <div className="quote-compose-heading">
          <p className="quote-compose-kicker">QUOTE FILM</p>
          <h2 id="quote-edit-title">필름 장면 수정</h2>
          <p>기록한 명대사를 다시 다듬어보세요.</p>
        </div>

        <div className="quote-compose-selected">
          <Film size={17} aria-hidden />
          <span>{quote.movie?.title ?? '영화 정보 없음'}</span>
        </div>

        <form
          className="quote-compose-form"
          onSubmit={handleSubmit(handleSave)}
        >
          <label className="quote-compose-label" htmlFor="quote-edit-text">
            한국어 명대사
          </label>

          <div className="quote-suggestion-header">
            <span>AI 명대사 추천</span>

            <button
              type="button"
              className="quote-suggestion-button"
              onClick={() => void onRecommendQuotes()}
              disabled={isRecommendingQuotes}
            >
              {isRecommendingQuotes ? '추천 중…' : '추천받기'}
            </button>
          </div>

          {quoteSuggestionError ? (
            <p className="quote-compose-error" role="alert">
              {quoteSuggestionError}
            </p>
          ) : null}

          {quoteSuggestions.length > 0 ? (
            <div className="quote-suggestions">
              {quoteSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.originalText}-${index}`}
                  type="button"
                  className="quote-suggestion-item"
                  onClick={() => {
                    reset({
                      text: suggestion.koreanText,
                      originalText:
                        suggestion.originalText !== suggestion.koreanText
                          ? suggestion.originalText
                          : null,
                      originalLanguage: suggestion.originalLanguage || null,
                      usePosterBackground: quote?.usePosterBackground ?? true,
                    });
                  }}
                >
                  <strong>{suggestion.koreanText}</strong>

                  {suggestion.originalText !== suggestion.koreanText ? (
                    <small>{suggestion.originalText}</small>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          <textarea
            id="quote-edit-text"
            {...register('text')}
            placeholder="한국어 명대사를 입력하세요."
            maxLength={1000}
            rows={4}
          />

          {errors.text && (
            <p className="quote-compose-error" role="alert">
              {errors.text.message}
            </p>
          )}

          <label
            className="quote-compose-label"
            htmlFor="quote-edit-original-text"
          >
            원문 대사
          </label>

          <textarea
            id="quote-edit-original-text"
            {...register('originalText')}
            placeholder="영화의 원문 대사를 입력하세요."
            maxLength={1000}
            rows={3}
          />

          {errors.originalText && (
            <p className="quote-compose-error" role="alert">
              {errors.originalText.message}
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
              <p>{watch('text') || quote.text}</p>
              {watch('originalText') ? (
                <small>{watch('originalText')}</small>
              ) : null}
              <small>{quote.movie?.title ?? 'QUOTE FILM'}</small>
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
            disabled={isSubmitting}
          >
            <Save size={18} aria-hidden />
            {isSubmitting ? '수정 중…' : '수정 저장'}
          </button>
        </form>
      </section>
    </div>
  );
}
