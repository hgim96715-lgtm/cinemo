'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDialogFocusRestore } from '@/hooks/useDialogFocusRestore';

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
  const { handleOpenAutoFocus, handleCloseAutoFocus } =
    useDialogFocusRestore();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-modal-backdrop" />

        <Dialog.Content
          className={`confirm-modal confirm-modal--${tone}`}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <Dialog.Close asChild>
            <button
              type="button"
              className="confirm-modal-close"
              aria-label="모달 닫기"
            >
              <X size={18} aria-hidden />
            </button>
          </Dialog.Close>

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

              <Dialog.Title asChild>
                <h2>{title}</h2>
              </Dialog.Title>
            </div>
          </div>

          <Dialog.Description asChild>
            <p>{description}</p>
          </Dialog.Description>

          <div className="confirm-modal-actions">
            <button
              type="button"
              className="confirm-modal-confirm"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>

            {cancelLabel ? (
              <Dialog.Close asChild>
                <button type="button">{cancelLabel}</button>
              </Dialog.Close>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
