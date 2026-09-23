'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function MovieDetailModalSkeleton() {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="movie-detail-overlay" />

      <Dialog.Content
        className="movie-detail-modal movie-detail-modal--loading"
        aria-describedby={undefined}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <Dialog.Close asChild>
          <button
            type="button"
            className="movie-detail-close"
            aria-label="상세 설명 닫기"
          >
            <X size={22} strokeWidth={1.5} aria-hidden />
          </button>
        </Dialog.Close>

        <Dialog.Title asChild>
          <h2 className="movie-detail-sr-only">영화 상세 정보를 불러오는 중</h2>
        </Dialog.Title>

        <div className="movie-detail-content" aria-busy="true">
          <div className="movie-detail-skeleton-poster" />

          <span className="movie-detail-skeleton-line movie-detail-skeleton-kicker" />

          <div className="movie-detail-skeleton-info">
            <span className="movie-detail-skeleton-line is-title" />
            <span className="movie-detail-skeleton-line" />
            <span className="movie-detail-skeleton-line is-wide" />
            <span className="movie-detail-skeleton-line is-description" />
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
