'use client';

import { Check, CircleAlert, X } from 'lucide-react';
import type { MoviePoolSeedRun } from '@cinemo/shared';

type Props = {
  run: MoviePoolSeedRun;
  onClose: () => void;
};

const STATUS_LABEL = {
  running: '실행 중',
  succeeded: '성공',
  partial: '부분 성공',
  failed: '실패',
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AdminSeedRunModal({ run, onClose }: Props) {
  const isSuccess = run.status === 'succeeded';
  const isRunning = run.status === 'running';

  return (
    <div className="admin-seed-modal-overlay" onClick={onClose}>
      <section
        className="admin-seed-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-seed-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="admin-seed-modal-close"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        <p className="admin-kicker">MOVIEPOOL SEED</p>

        <h2 id="admin-seed-modal-title" className="admin-seed-modal-title">
          {isRunning ? 'MoviePool 시드 실행 중' : 'MoviePool 시드 결과'}
        </h2>

        <div className={`admin-seed-status admin-seed-status--${run.status}`}>
          {isSuccess ? <Check size={16} /> : <CircleAlert size={16} />}
          {STATUS_LABEL[run.status]}
        </div>

        <p className="admin-seed-modal-meta">
          {run.trigger === 'cron' ? '새벽 자동 실행' : '관리자 수동 실행'}
          {' · '}
          {formatDate(run.startedAt)}
        </p>

        <dl className="admin-seed-stats">
          <div>
            <dt>머신</dt>
            <dd>{run.machineCount}개</dd>
          </div>
          <div>
            <dt>페이지</dt>
            <dd>
              {run.processedPages} / {run.machineCount * run.pages}
            </dd>
          </div>
          <div>
            <dt>조회</dt>
            <dd>{run.fetchedCount.toLocaleString()}편</dd>
          </div>
          <div>
            <dt>저장</dt>
            <dd>{run.savedCount.toLocaleString()}편</dd>
          </div>
          <div>
            <dt>건너뜀</dt>
            <dd>{run.skippedCount.toLocaleString()}편</dd>
          </div>
          <div>
            <dt>실패</dt>
            <dd>{run.failedCount.toLocaleString()}건</dd>
          </div>
        </dl>

        {run.errorMessage ? (
          <p className="admin-seed-error">{run.errorMessage}</p>
        ) : null}

        <button
          type="button"
          className="admin-ops-btn admin-ops-btn--primary admin-seed-modal-action"
          onClick={onClose}
        >
          확인
        </button>
      </section>
    </div>
  );
}
