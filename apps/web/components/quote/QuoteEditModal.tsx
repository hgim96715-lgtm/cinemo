'use client';

import { useEffect, type CSSProperties } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Film, Save, X } from 'lucide-react';
import type { QuotePostItem } from '@cinemo/shared';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import '../../app/styles/quote.css';

const quoteEditSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, '명대사를 입력하세요.')
    .max(1000, '명대사는 1000자까지 입력할 수 있습니다.'),
  usePosterBackground: z.boolean(),
});

type QuoteEditFormValues = z.infer<typeof quoteEditSchema>;

type QuoteEditModalProps = {
  isOpen: boolean;
  quote: QuotePostItem | null;
  onClose: () => void;
  onSubmit: (input: {
    text: string;
    usePosterBackground: boolean;
  }) => void | Promise<void>;
};

export default function QuoteEditModal({
  isOpen,
  quote,
  onClose,
  onSubmit,
}: QuoteEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuoteEditFormValues>({
    resolver: zodResolver(quoteEditSchema),
    defaultValues: {
      text: '',
      usePosterBackground: true,
    },
  });

  useEffect(() => {
    if (!quote || !isOpen) {
      return;
    }

    reset({
      text: quote.text,
      usePosterBackground: quote.usePosterBackground,
    });
  }, [quote, isOpen, reset]);

  const handleSave: SubmitHandler<QuoteEditFormValues> = async (values) => {
    try {
      await onSubmit(values);
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
            명대사
          </label>

          <textarea
            id="quote-edit-text"
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
              <p>{quote.text}</p>
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
