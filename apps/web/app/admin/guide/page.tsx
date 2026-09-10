'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_LOBBY_GUIDE_STEPS, LobbyGuideStep } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import { getLobbyGuideRequest, updateLobbyGuideRequest } from '@/lib/guide-api';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import '../../styles/admin-guide.css';

export default function AdminGuidePage() {
  const token = useAuthStore((s) => s.accessToken);
  const [steps, setSteps] = useState<LobbyGuideStep[]>(
    DEFAULT_LOBBY_GUIDE_STEPS,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'save' | 'reset' | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function loadGuide() {
      try {
        const guide = await getLobbyGuideRequest();
        const isLegacyGuide = guide.steps.some((step) => step.id === 'gacha');
        if (!cancelled) {
          setSteps(isLegacyGuide ? DEFAULT_LOBBY_GUIDE_STEPS : guide.steps);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '가이드 문구를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadGuide();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateStep(
    index: number,
    field: keyof LobbyGuideStep,
    value: string,
  ) {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step,
      ),
    );
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        id: `step-${current.length + 1}`,
        kicker: 'NEW STEP',
        title: '새 가이드 제목',
        body: '새 가이드 내용을 입력하세요',
      },
    ]);
  }

  function removeStep(index: number) {
    setSteps((current) =>
      current.length <= 1
        ? current
        : current.filter((_, stepIndex) => stepIndex !== index),
    );
  }

  async function resetGuideToDefault() {
    if (!token) return;

    setSaving(true);
    setError(null);

    try {
      const guide = await updateLobbyGuideRequest(token, {
        steps: DEFAULT_LOBBY_GUIDE_STEPS,
      });
      setSteps(guide.steps);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : '기본 가이드 적용에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveGuide() {
    if (!token) return;

    const normalizedSteps = steps.map((step) => ({
      id: step.id.trim(),
      kicker: step.kicker.trim(),
      title: step.title.trim(),
      body: step.body.trim(),
    }));
    if (
      normalizedSteps.some(
        (step) => !step.id || !step.kicker || !step.title || !step.body,
      )
    ) {
      setError('가이드의 ID, Kicker, 제목, 본문을 모두 입력해야 합니다.');
      return;
    }

    const ids = normalizedSteps.map((step) => step.id);
    if (new Set(ids).size !== ids.length) {
      setError('가이드의 ID는 중복될 수 없습니다.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const guide = await updateLobbyGuideRequest(token, {
        steps: normalizedSteps,
      });
      setSteps(guide.steps);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '가이드 문구 저장에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="admin-main">
      <h2 className="admin-title">로비 가이드</h2>
      <p className="admin-sub">
        로비 가이드의 ID, Kicker, 제목, 본문을 단계별로 관리한다.
      </p>

      <section className="admin-ops-card">
        {loading ? (
          <p className="admin-ops-hint">불러오는 중…</p>
        ) : (
          <>
            {steps.map((step, index) => (
              <article key={`${step.id}-${index}`} className="admin-guide-step">
                <div className="admin-ops-toolbar">
                  <strong>STEP {index + 1}</strong>
                  <button
                    type="button"
                    className="admin-ops-btn"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 1}
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>

                <label className="admin-ops-field">
                  <span>ID</span>
                  <input
                    className="admin-ops-input admin-ops-input--wide"
                    value={step.id}
                    onChange={(event) =>
                      updateStep(index, 'id', event.target.value)
                    }
                    maxLength={32}
                  />
                </label>

                <label className="admin-ops-field">
                  <span>Kicker</span>
                  <input
                    className="admin-ops-input admin-ops-input--wide"
                    value={step.kicker}
                    onChange={(event) =>
                      updateStep(index, 'kicker', event.target.value)
                    }
                    maxLength={64}
                  />
                </label>

                <label className="admin-ops-field">
                  <span>제목</span>
                  <input
                    className="admin-ops-input admin-ops-input--wide"
                    value={step.title}
                    onChange={(event) =>
                      updateStep(index, 'title', event.target.value)
                    }
                    maxLength={128}
                  />
                </label>

                <label className="admin-ops-field">
                  <span>본문</span>
                  <textarea
                    className="admin-ops-input"
                    value={step.body}
                    onChange={(event) =>
                      updateStep(index, 'body', event.target.value)
                    }
                    rows={3}
                    maxLength={200}
                  />
                </label>
              </article>
            ))}

            <div className="admin-ops-toolbar admin-guide-actions">
              <button
                type="button"
                className="admin-ops-btn"
                onClick={addStep}
                disabled={steps.length >= 20}
              >
                <Plus size={14} />
                단계 추가
              </button>

              <div className="admin-guide-actions-primary">
                <button
                  type="button"
                  className="admin-ops-btn admin-guide-reset-btn"
                  onClick={() => setConfirmAction('reset')}
                  disabled={saving || !token}
                >
                  기본값으로 되돌리기
                </button>

                <button
                  type="button"
                  className="admin-ops-btn admin-ops-btn--primary admin-guide-save-btn"
                  onClick={() => setConfirmAction('save')}
                  disabled={saving || !token}
                >
                  {saving ? '저장 중…' : '저장'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="admin-ops-result admin-ops-result--error">
                <AlertCircle size={14} />
                {error}
              </div>
            ) : null}
          </>
        )}
      </section>
      <ConfirmModal
        open={confirmAction !== null}
        title={
          confirmAction === 'reset' ? '기본값으로 되돌리기' : '가이드 저장'
        }
        description={
          confirmAction === 'reset'
            ? '현재 가이드 내용을 기본값으로 되돌리겠습니까?'
            : '현재 가이드 내용을 저장하시겠습니까?'
        }
        confirmLabel={confirmAction === 'reset' ? '되돌리기' : '저장'}
        cancelLabel="취소"
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);

          if (action === 'reset') {
            void resetGuideToDefault();
          }

          if (action === 'save') {
            void saveGuide();
          }
        }}
      />
    </main>
  );
}
