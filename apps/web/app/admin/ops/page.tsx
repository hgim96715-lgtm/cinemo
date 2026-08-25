'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { GACHA_MACHINES } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import {
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
    if (loading !== 'all') {
      setProgress(null);
      return;
    }
    async function poll() {
      try {
        const progress = await getSeedPoolProgressRequest(token);
        if (progress) setProgress(progress);
      } catch {
        /* ignore */
      }
    }
    void poll();
    const interval = window.setInterval(poll, 1000);
    return () => window.clearInterval(interval);
  }, [loading, token]);

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

  return (
    <main className="admin-main">
      <h2 className="admin-title">운영</h2>
      <p className="admin-sub">MoviePool 시드와 OTT 예외를 여기서 다룹니다.</p>

      <div className="admin-ops-grid">
        <section className="admin-ops-card">
          <h3 className="admin-ops-heading">MoviePool 시드</h3>
          <p className="admin-ops-desc">
            TMDB에서 영화를 가져와 풀을 채웁니다. cron은 매일 KST 02:00 자동
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
                  onChange={(e) => setPages(Number(e.target.value))}
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
