'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { GACHA_MACHINES } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import {
  cancelSeedPoolRequest,
  getSeedPoolProgressRequest,
  seedPoolAllRequest,
  seedPoolRequest,
  SeedProgress,
} from '@/lib/tmdb-api';
import { AdminProviderOverrides } from '@/components/admin/AdminProviderOverrides';

type ResultRow = {
  id: string;
  ok: boolean;
  fetchedCount: number;
  savedCount: number;
  skippedCount: number;
  failedCount: number;
};

type ResultState =
  | { kind: 'rows'; rows: ResultRow[] }
  | { kind: 'error'; message: string }
  | null;

export default function AdminOpsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [pages, setPages] = useState(5);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>(null);
  const [progress, setProgress] = useState<SeedProgress | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const recoveredProgressRef = useRef(false);

  async function seedAll() {
    setProgress(null);
    setLoading('all');
    setResult(null);
    try {
      const res = await seedPoolAllRequest(token, pages);
      const rows = Object.entries(res).map(([id, result]) => ({
        id,
        ok: result.ok,
        fetchedCount: result.fetchedCount,
        savedCount: result.savedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
      }));
      setResult({ kind: 'rows', rows });
    } catch (error) {
      setResult({
        kind: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(null);
      setProgress(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const current = await getSeedPoolProgressRequest(token);
        if (cancelled) return;
        if (current) {
          recoveredProgressRef.current = true;
          setProgress(current);
          setLoading((value) => value ?? 'all');
          return;
        }
        if (recoveredProgressRef.current) {
          recoveredProgressRef.current = false;
          setLoading(null);
          setProgress(null);
        }
      } catch {
        //진행률 조회 실패는 다음 폴링에서 재시도
      }
    }
    void poll();
    const interval = window.setInterval(poll, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [token]);

  async function seedOne(machineId: string) {
    setLoading(machineId);
    setResult(null);
    try {
      const res = await seedPoolRequest(token, machineId, pages);
      setResult({
        kind: 'rows',
        rows: [
          {
            id: machineId,
            ok: res.ok,
            fetchedCount: res.fetchedCount,
            savedCount: res.savedCount,
            skippedCount: res.skippedCount,
            failedCount: res.failedCount,
          },
        ],
      });
    } catch (error) {
      setResult({
        kind: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(null);
    }
  }
  async function cancelAll() {
    if (loading !== 'all' || cancelling) return;
    setCancelling(true);
    try {
      const response = await cancelSeedPoolRequest(token);
      setResult({
        kind: 'error',
        message: response.cancelled
          ? '중단 요청을 보냈습니다.'
          : '실행 중인 시드가 없습니다.',
      });
    } catch (error) {
      setResult({
        kind: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="admin-main">
      <h2 className="admin-title">운영</h2>
      <p className="admin-sub">MoviePool 시드와 OTT 예외를 여기서 다룹니다.</p>

      <div className="admin-ops-grid">
        <section className="admin-ops-card">
          <h3 className="admin-ops-heading">MoviePool 시드</h3>
          <p className="admin-ops-desc">
            TMDB에서 영화를 가져와 풀을 채웁니다. cron은 매일 KST 02:05 자동
            실행.
          </p>

          <div className="admin-ops-toolbar">
            <label className="admin-ops-field">
              <span>페이지 수</span>
              <span className="admin-ops-inline">
                <input
                  type="number"
                  className="admin-ops-input"
                  min={1}
                  max={20}
                  value={pages}
                  onChange={(e) => {
                    const input = e.currentTarget;
                    const normalized = input.value.replace(/^0+(?=\d)/, '');
                    input.value = normalized;
                    setPages(normalized === '' ? 0 : Number(normalized));
                  }}
                />
                <em>= {pages * 20}편</em>
              </span>
            </label>
            <button
              className="admin-ops-btn admin-ops-btn--primary"
              onClick={() => void seedAll()}
              disabled={loading !== null}
            >
              {loading === 'all' ? '실행 중…' : '전체 머신 시드'}
            </button>
            {loading === 'all' ? (
              <button
                className="admin-ops-btn admin-ops-btn--danger"
                onClick={() => void cancelAll()}
                disabled={cancelling}
              >
                {cancelling ? '중단 요청 중…' : '중단'}
              </button>
            ) : null}
          </div>
          {loading === 'all' && (
            <div className="admin-ops-progress">
              <div className="admin-ops-progress-bar">
                <div
                  className="admin-ops-progress-fill"
                  style={{
                    width: progress
                      ? `${Math.round((progress.done / progress.total) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <p className="admin-ops-hint">
                {progress
                  ? `${Math.round((progress.done / progress.total) * 100)}% (${progress.done}/${progress.total}) · ${progress.machineId}`
                  : '시작 중…'}
              </p>
            </div>
          )}

          <p className="admin-ops-kicker">머신별</p>
          <div className="admin-ops-machines">
            {GACHA_MACHINES.map((m) => (
              <button
                key={m.id}
                className="admin-ops-chip"
                onClick={() => void seedOne(m.id)}
                disabled={loading !== null}
              >
                {loading === m.id ? '…' : m.label}
              </button>
            ))}
          </div>

          {result?.kind === 'error' && (
            <div className="admin-ops-result admin-ops-result--error">
              <AlertCircle size={14} />
              {result.message}
            </div>
          )}
          {result?.kind === 'rows' && (
            <ul className="admin-ops-result-list">
              {result.rows.map((r) => (
                <li key={r.id} className="admin-ops-result-row">
                  <div className="admin-ops-result-heading">
                    {r.ok ? (
                      <Check size={13} className="admin-ops-icon--ok" />
                    ) : (
                      <X size={13} className="admin-ops-icon--fail" />
                    )}

                    <strong>{r.id}</strong>
                    <span>{r.ok ? '성공' : '부분 실패'}</span>
                  </div>

                  <div className="admin-ops-result-stats">
                    조회 {r.fetchedCount.toLocaleString()}편 · 저장{' '}
                    {r.savedCount.toLocaleString()}편 · 건너뜀{' '}
                    {r.skippedCount.toLocaleString()}편 · 실패{' '}
                    {r.failedCount.toLocaleString()}건
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <AdminProviderOverrides token={token} />
      </div>
    </main>
  );
}
