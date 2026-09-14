'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminPeople, AdminPeopleFeedItem } from '@cinemo/shared';
import {
  getAdminPeopleFeedRequest,
  getAdminPeopleRequest,
} from '@/lib/admin-api';
import { useAuthStore } from '@/lib/auth-store';
import { formatKstDayTime } from '@/lib/date-kst';

function kstStamp(iso: string) {
  return formatKstDayTime(iso);
}

export default function AdminUsersPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [people, setPeople] = useState<AdminPeople | null>(null);
  const [feed, setFeed] = useState<AdminPeopleFeedItem[]>([]);
  const [feedTotal, setFeedTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    let cancelled = false;
    async function load() {
      try {
        const data = await getAdminPeopleRequest(token);
        if (!cancelled) {
          setPeople(data);
          setFeed(data.feed);
          setFeedTotal(data.feedTotal);
        }
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error
              ? e.message
              : '사용자를 불러오는데 실패했습니다.',
          );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const guests = useMemo(() => {
    if (!people) return [];
    const q = query.trim().toLowerCase();
    if (!q) return people.guests;
    return people.guests.filter((row) =>
      row.nickname.toLowerCase().includes(q),
    );
  }, [people, query]);

  async function loadMore() {
    if (!accessToken || loadingMore || feed.length >= feedTotal) return;
    setLoadingMore(true);
    try {
      const next = await getAdminPeopleFeedRequest(accessToken, feed.length);
      setFeed((rows) => [...rows, ...next.items]);
      setFeedTotal(next.total);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '기록을 더 불러오지 못했습니다.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="admin-main">
      <h1 className="admin-title">사용자</h1>
      <p className="admin-sub">가입 명단 · 이번주 기록 최근 20건</p>
      {error ? <p className="admin-error">{error}</p> : null}
      {!people && !error ? <p className="admin-status">불러오는 중…</p> : null}
      {people ? (
        <>
          <ul className="admin-people-stats">
            <li>
              가입<strong>{people.guests.length}</strong>
            </li>
            <li>
              오늘 방문<strong>{people.todayVisitCount}</strong>
            </li>
            <li>
              오늘 로그인<strong>{people.todayLoginCount}</strong>
            </li>
          </ul>
          <div className="admin-people">
            <section>
              <div className="admin-people-head">
                <h2 className="admin-people-h">명단</h2>
                <input
                  className="admin-people-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="닉네임 검색"
                  aria-label="닉네임 검색"
                />
              </div>
              {guests.length === 0 ? (
                <p className="admin-status">
                  {query.trim() ? '검색 결과가 없어요' : '가입자가 없어요'}
                </p>
              ) : (
                <ul className="admin-people-grid">
                  {guests.map((row) => (
                    <li key={row.id} className="admin-guest">
                      <span className="admin-guest-mark" aria-hidden>
                        {row.nickname.slice(0, 1)}
                      </span>
                      <div>
                        <p className="admin-guest-nick">{row.nickname}</p>
                        <dl className="admin-guest-meta">
                          <div>
                            <dt>가입</dt>
                            <dd>{kstStamp(row.createdAt)}</dd>
                          </div>
                          <div>
                            <dt>방문</dt>
                            <dd>
                              {row.lastVisitedAt
                                ? kstStamp(row.lastVisitedAt)
                                : '—'}
                            </dd>
                          </div>
                          <div>
                            <dt>로그인</dt>
                            <dd>
                              {row.lastLoggedAt
                                ? kstStamp(row.lastLoggedAt)
                                : '—'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="admin-people-h">기록</h2>
              {feed.length === 0 ? (
                <p className="admin-status">이번주 기록이 없어요</p>
              ) : (
                <>
                  <ol className="admin-feed">
                    {feed.map((row, i) => (
                      <li key={`${row.kind}-${row.nickname}-${row.at}-${i}`}>
                        <span
                          className={
                            row.kind === 'visit'
                              ? 'admin-feed-kind admin-feed-kind--visit'
                              : 'admin-feed-kind'
                          }
                        >
                          {row.kind === 'visit' ? '방문' : '로그인'}
                        </span>
                        <span className="admin-feed-nick">{row.nickname}</span>
                        <time dateTime={row.at}>{kstStamp(row.at)}</time>
                      </li>
                    ))}
                  </ol>
                  {feed.length < feedTotal ? (
                    <button
                      type="button"
                      className="admin-feed-more"
                      onClick={() => void loadMore()}
                      disabled={loadingMore}
                    >
                      {loadingMore
                        ? '불러오는 중…'
                        : `더 보기 (${feed.length}/${feedTotal})`}
                    </button>
                  ) : (
                    <p className="admin-feed-end">이번주 {feedTotal}건</p>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}
