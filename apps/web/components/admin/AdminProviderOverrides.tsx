'use client';

import { useState } from 'react';
import { AlertCircle, Check, Plus, Minus } from 'lucide-react';
import {
  listProviderOverridesRequest,
  upsertProviderOverrideRequest,
  type ProviderOverride,
} from '@/lib/tmdb-api';
import { WATCH_PROVIDERS, providerLogoUrl } from '@/lib/watch-providers';

type Props = { token: string | null };

export function AdminProviderOverrides({ token }: Props) {
  const [tmdbIdInput, setTmdbIdInput] = useState('');
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<ProviderOverride[]>([]);
  const [providerIdx, setProviderIdx] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load(id: number) {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const rows = await listProviderOverridesRequest(token, id);
      setTmdbId(id);
      setOverrides(rows);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  async function submit(action: 'add' | 'remove') {
    if (tmdbId == null) return;
    const ott = WATCH_PROVIDERS[providerIdx];
    if (!ott) return;
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      await upsertProviderOverrideRequest(token, {
        tmdbId,
        providerId: ott.providerId,
        providerName: ott.providerName,
        logoPath: ott.logoPath,
        action,
        note: note.trim() || undefined,
      });
      setOk(`${ott.providerName} ${action === 'add' ? '추가' : '제거'} 저장`);
      setNote('');
      await load(tmdbId);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-ops-card">
      <h3 className="admin-ops-heading">OTT Override</h3>
      <p className="admin-ops-desc">
        TMDB에 없거나 틀린 OTT를 영화(tmdbId)별로 add/remove. 영화 상세 카드에
        merge 반영.
      </p>

      <label className="admin-ops-field">
        <span>TMDB ID</span>
        <span className="admin-ops-inline">
          <input
            type="number"
            className="admin-ops-input admin-ops-input--wide"
            min={1}
            value={tmdbIdInput}
            onChange={(e) => setTmdbIdInput(e.target.value)}
            placeholder="496243"
          />
          <button
            type="button"
            className="admin-ops-btn"
            disabled={loading || !tmdbIdInput}
            onClick={() => void load(Number(tmdbIdInput))}
          >
            조회
          </button>
        </span>
      </label>

      {tmdbId != null && (
        <>
          <label className="admin-ops-field">
            <span>OTT</span>
            <span className="admin-ops-inline">
              {WATCH_PROVIDERS[providerIdx] ? (
                <img
                  src={providerLogoUrl(WATCH_PROVIDERS[providerIdx].logoPath)}
                  alt=""
                  className="admin-ops-ott-logo"
                />
              ) : null}
              <select
                className="admin-ops-input admin-ops-input--wide"
                value={providerIdx}
                onChange={(e) => setProviderIdx(Number(e.target.value))}
              >
                {WATCH_PROVIDERS.map((p, i) => (
                  <option key={`${p.providerId}-${i}`} value={i}>
                    {p.providerName} ({p.providerId})
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className="admin-ops-field">
            <span>메모</span>
            <input
              type="text"
              className="admin-ops-input admin-ops-input--wide"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="웨이브 앱에서 확인"
            />
          </label>

          <div className="admin-ops-actions">
            <button
              type="button"
              className="admin-ops-btn admin-ops-btn--primary"
              disabled={loading}
              onClick={() => void submit('add')}
            >
              <Plus size={14} aria-hidden />
              add
            </button>
            <button
              type="button"
              className="admin-ops-btn"
              disabled={loading}
              onClick={() => void submit('remove')}
            >
              <Minus size={14} aria-hidden />
              remove
            </button>
          </div>

          {overrides.length > 0 && (
            <ul className="admin-ops-result-list">
              {overrides.map((o) => (
                <li key={o.id} className="admin-ops-result-row">
                  {o.action === 'add' ? (
                    <Plus size={13} className="admin-ops-icon--ok" />
                  ) : (
                    <Minus size={13} className="admin-ops-icon--fail" />
                  )}
                  {o.logoPath ? (
                    <img
                      src={providerLogoUrl(o.logoPath)}
                      alt=""
                      className="admin-ops-ott-logo"
                    />
                  ) : null}
                  {o.providerName} ({o.providerId}) · {o.action}
                  {o.note ? ` · ${o.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && (
        <div className="admin-ops-result admin-ops-result--error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      {ok && (
        <div className="admin-ops-result admin-ops-result--ok">
          <Check size={14} />
          {ok}
        </div>
      )}
    </section>
  );
}
