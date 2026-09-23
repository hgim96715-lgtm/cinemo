'use client';

import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/common/ConfirmModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function UserMovieShelfLoginModal({ open, onClose }: Props) {
  const router = useRouter();

  return (
    <ConfirmModal
      open={open}
      eyebrow="MY CINEMA"
      title="로그인이 필요해요"
      description="MY CINEMA는 로그인 후 이용할 수 있어요."
      confirmLabel="로그인"
      cancelLabel="닫기"
      onConfirm={() => {
        onClose();
        router.replace('/login?next=/my-cinema');
      }}
      onClose={onClose}
    />
  );
}
