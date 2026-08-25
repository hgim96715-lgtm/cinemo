'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_LOBBY_GUIDE_STEPS, type LobbyGuideStep } from '@cinemo/shared';
import { getLobbyGuideRequest } from '@/lib/guide-api';
import { useGuideStore } from '@/lib/guide-store';

type Props = {
  onClose: () => void;
};

export function LobbyGuideModal({ onClose }: Props) {
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
    <div className="wardrobe-overlay guide-overlay" onClick={closeGuide}>
      <div
        className="wardrobe-panel guide-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        <button
          type="button"
          className="wardrobe-close"
          onClick={closeGuide}
          aria-label="닫기"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <p className="wardrobe-kicker">{step.kicker}</p>

        <h2 id="guide-title" className="guide-title">
          {step.title}
        </h2>

        <div className="guide-step">
          <p className="guide-step-body">{step.body}</p>
        </div>

        <div className="guide-dots" aria-hidden>
          {steps.map((guideStep, index) => (
            <span
              key={`${guideStep.id}-${index}`}
              className={`guide-dot${index === stepIndex ? ' is-active' : ''}`}
            />
          ))}
        </div>

        <p className="guide-progress">
          {stepIndex + 1} / {steps.length}
        </p>

        <div className="guide-actions">
          <button
            type="button"
            className="lobby-btn"
            onClick={goPreviousStep}
            disabled={isFirst}
          >
            이전
          </button>

          <button type="button" className="lobby-btn" onClick={closeGuide}>
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
      </div>
    </div>
  );
}
