'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useDialogFocusRestore } from '@/hooks/useDialogFocusRestore';

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
  const { handleOpenAutoFocus, handleCloseAutoFocus } =
    useDialogFocusRestore();
  const [watchedAt, setWatchedAt] = useState(initialDate);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="movie-calendar-modal-backdrop" />
        <Dialog.Content
          className="movie-calendar-modal movie-calendar-edit-modal"
          aria-describedby={undefined}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
        <header className="movie-calendar-header">
          <div>
            <p className="movie-calendar-kicker">EDIT SCREENING DATE</p>
            <Dialog.Title asChild>
              <h2>관람일 수정</h2>
            </Dialog.Title>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="movie-calendar-close"
              disabled={isPending}
              aria-label="관람일 수정 닫기"
            >
              <X size={22} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </Dialog.Close>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
