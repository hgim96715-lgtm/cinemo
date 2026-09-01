'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';
import '../../app/styles/quote.css';

type QuoteActionModalProps = {
  isOpen: boolean;
  mode: 'confirm' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  isPending?: boolean;
};

export default function QuoteActionModal({
  isOpen,
  mode,
  title,
  message,
  onClose,
  onConfirm,
  isPending = false,
}: QuoteActionModalProps) {
  if (!isOpen) return null;

  const isConfirm = mode === 'confirm';

  return (
    <div className="quote-compose-overlay" onClick={onClose} role="presentation">
      <section
        className="quote-compose-modal quote-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-action-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="quote-compose-close"
          onClick={onClose}
          aria-label="모달 닫기"
        >
          <X size={22} aria-hidden />
        </button>

        <div className="quote-action-icon" aria-hidden>
          {isConfirm ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
        </div>
        <div className="quote-compose-heading">
          <p className="quote-compose-kicker">QUOTE FILM</p>
          <h2 id="quote-action-title">{title}</h2>
          <p>{message}</p>
        </div>

        <div className="quote-action-buttons">
          <button
            type="button"
            className="quote-action-button quote-action-button--secondary"
            onClick={onClose}
            disabled={isPending}
          >
            {isConfirm ? '취소' : '닫기'}
          </button>
          {isConfirm && (
            <button
              type="button"
              className="quote-action-button quote-action-button--danger"
              onClick={() => void onConfirm?.()}
              disabled={isPending}
            >
              {isPending ? '삭제 중…' : '삭제하기'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
