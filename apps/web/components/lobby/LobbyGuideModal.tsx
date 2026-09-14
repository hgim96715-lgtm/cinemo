'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { DEFAULT_LOBBY_GUIDE_STEPS, type LobbyGuideStep } from '@cinemo/shared';
import { getLobbyGuideRequest } from '@/lib/guide-api';
import { useGuideStore } from '@/lib/guide-store';
import { useDialogFocusRestore } from '@/hooks/useDialogFocusRestore';

type Props = {
  onClose: () => void;
};

export function LobbyGuideModal({ onClose }: Props) {
  const { handleOpenAutoFocus, handleCloseAutoFocus } =
    useDialogFocusRestore();
  const finishGuide = useGuideStore((s) => s.finishGuide);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<LobbyGuideStep[]>(
    DEFAULT_LOBBY_GUIDE_STEPS,
  );

  useEffect(() => {
    let cancelled = false;
    async function loadGuide() {
      try {
        const guide = await getLobbyGuideRequest();
        if (!cancelled && guide.steps.length > 0) {
          setSteps(guide.steps);
        }
      } catch {
        // API 실패 시 기본 가이드 스텝 사용
      }
    }
    void loadGuide();
    return () => {
      cancelled = true;
    };
  }, []);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  function closeGuide() {
    finishGuide();
    onClose();
  }

  function goPreviousStep() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function goNextStep() {
    if (isLast) {
      closeGuide();
      return;
    }

    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) closeGuide();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="wardrobe-overlay guide-overlay" />
        <Dialog.Content
          className="wardrobe-panel guide-panel"
          aria-describedby={undefined}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <Dialog.Close asChild>
            <button type="button" className="wardrobe-close" aria-label="닫기">
              <X size={16} strokeWidth={2} />
            </button>
          </Dialog.Close>

          <p className="wardrobe-kicker">{step.kicker}</p>

          <Dialog.Title asChild>
            <h2 className="guide-title">{step.title}</h2>
          </Dialog.Title>

        <div className="guide-step">
          <p className="guide-step-body">{step.body}</p>
        </div>

        <p className="guide-progress">
          {String(stepIndex + 1).padStart(2, '0')} /{' '}
          {String(steps.length).padStart(2, '0')}
        </p>

        <div className="guide-actions">
          <button
            type="button"
            className="lobby-btn guide-previous-btn"
            onClick={goPreviousStep}
            disabled={isFirst}
            aria-label="이전 단계"
            title="이전 단계"
          >
            <ArrowLeft size={16} aria-hidden />
          </button>

          <button
            type="button"
            className="lobby-btn guide-skip-btn"
            onClick={closeGuide}
          >
            건너뛰기
          </button>

          <button
            type="button"
            className="lobby-btn lobby-btn--primary"
            onClick={goNextStep}
          >
            {isLast ? '시작하기' : '다음'}
          </button>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
