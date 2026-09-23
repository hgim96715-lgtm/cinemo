'use client';

import { ConfirmModal } from './ConfirmModal';
import '@/styles/confirm-modal.css';

type ErrorModalProps = {
  open: boolean;
  title?: string;
  description: string;
  eyebrow?: string;
  onClose: () => void;
};

export function ErrorModal({
  open,
  title = '오류가 발생했어요',
  description,
  eyebrow,
  onClose,
}: ErrorModalProps) {
  return (
    <ConfirmModal
      open={open}
      title={title}
      description={description}
      eyebrow={eyebrow}
      eyebrowTone="danger"
      confirmLabel="확인"
      onConfirm={onClose}
      onClose={onClose}
    />
  );
}
