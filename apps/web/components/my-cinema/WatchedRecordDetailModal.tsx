'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { X } from 'lucide-react';
import type { UserMovieCalendarItem } from '@cinemo/api-contract';

import { formatKstDateDots } from '@/lib/date-kst';
import { tmdbPosterUrl } from '@/lib/tmdb-image';

type Props = {
  open: boolean;
  movie: UserMovieCalendarItem;
  onClose: () => void;
};

export function WatchedRecordDetailModal({ open, movie, onClose }: Props) {
  const poster = tmdbPosterUrl(movie.posterPath, 'w342');

  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="movie-detail-overlay" />

        <Dialog.Content
          className="movie-detail-modal watched-record-detail-modal"
          aria-describedby={undefined}
        >
          <Dialog.Close asChild>
            <button
              type="button"
              className="movie-detail-close"
              aria-label="관람 기록 닫기"
            >
              <X size={22} strokeWidth={1.5} aria-hidden />
            </button>
          </Dialog.Close>

          <div className="watched-record-detail-poster">
            {poster ? (
              <Image
                src={poster}
                alt={`${movie.title} 포스터`}
                fill
                sizes="(max-width: 40rem) 80vw, 24rem"
              />
            ) : (
              <span>포스터 없음</span>
            )}
          </div>

          <Dialog.Title className="my-cinema-watched-kicker">
            CINEMO · WATCHED
          </Dialog.Title>

          <h2>{movie.title}</h2>

          <div className="watched-record-detail-meta">
            <div>
              <small>DATE</small>
              <strong>
                {formatKstDateDots(movie.watchedAt ?? movie.date)}
              </strong>
            </div>

            <div>
              <small>LOCATION</small>
              <strong>{movie.viewingPlace || '—'}</strong>
            </div>
          </div>

          <strong className="watched-record-detail-rating">
            {movie.rating == null ? '평점 없음' : `${movie.rating}/10`}
          </strong>

          <p className="watched-record-detail-review">
            {movie.review?.trim()
              ? `“${movie.review.trim()}”`
              : '아직 후기를 남기지 않았어요.'}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
