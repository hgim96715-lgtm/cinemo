// apps/web/components/common/ConfirmModal.tsx

'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  eyebrow?: string;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  eyebrow,
  icon,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'default',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="confirm-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={`confirm-modal confirm-modal--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="confirm-modal-close"
          aria-label="모달 닫기"
          onClick={onClose}
        >
          <X size={18} aria-hidden />
        </button>

        <div className={`confirm-modal-heading${icon ? ' has-icon' : ''}`}>
          {icon ? (
            <div className="confirm-modal-icon" aria-hidden="true">
              {icon}
            </div>
          ) : null}
          <div className="confirm-modal-heading-copy">
            {eyebrow ? (
              <p className="confirm-modal-eyebrow">{eyebrow}</p>
            ) : null}
            <h2 id={titleId}>{title}</h2>
          </div>
        </div>
        <p id={descriptionId}>{description}</p>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>

          <button type="button" onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
