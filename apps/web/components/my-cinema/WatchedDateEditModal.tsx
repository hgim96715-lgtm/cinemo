'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  initialDate: string;
  isPending?: boolean;
  onClose: () => void;
  onSave: (watchedAt: string) => void;
};

function getKstTodayDate() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
}

export function WatchedDateEditModal({
  initialDate,
  isPending = false,
  onClose,
  onSave,
}: Props) {
  const [watchedAt, setWatchedAt] = useState(initialDate);

  return (
    <div className="movie-calendar-modal-backdrop">
      <section
        className="movie-calendar-modal movie-calendar-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watched-date-edit-title"
      >
        <header className="movie-calendar-header">
          <div>
            <p className="movie-calendar-kicker">EDIT SCREENING DATE</p>
            <h2 id="watched-date-edit-title">관람일 수정</h2>
          </div>

          <button
            type="button"
            className="movie-calendar-close"
            onClick={onClose}
            disabled={isPending}
            aria-label="관람일 수정 닫기"
          >
            <X size={22} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>

        <label htmlFor="watched-date-input">새로운 관람일</label>
        <input
          id="watched-date-input"
          type="date"
          value={watchedAt}
          max={getKstTodayDate()}
          onChange={(event) => setWatchedAt(event.target.value)}
          disabled={isPending}
        />

        <div className="movie-calendar-edit-actions">
          <button
            type="button"
            className="movie-calendar-today"
            onClick={() => onSave(watchedAt)}
            disabled={isPending || !watchedAt}
          >
            {isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </section>
    </div>
  );
}
