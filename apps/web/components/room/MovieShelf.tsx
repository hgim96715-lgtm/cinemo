'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Heart } from 'lucide-react';
import type {
  UserMovieKind,
  UserMovieListItem,
  UserMovieMarks,
} from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import {
  getUserMovieMarksRequest,
  listUserMoviesRequest,
  toggleUserMovieRequest,
} from '@/lib/user-movie-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';

const PAGE_SIZE = 24;

type Props = {
  kind: UserMovieKind;
  title: string;
};

export function MovieShelf({ kind, title }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) router.replace('/login?next=/room');
  }, [hydrated, accessToken, router]);
  const [items, setItems] = useState<UserMovieListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [flippedId, setFlippedId] = useState<number | null>(null);
  const [marksByTmdbId, setMarksByTmdbId] = useState<
    Record<number, Pick<UserMovieMarks, 'wish' | 'watched'>>
  >({});
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  const seedMarks = useCallback(
    (list: UserMovieListItem[]) => {
      setMarksByTmdbId((prev) => {
        const next = { ...prev };
        for (const item of list) {
          next[item.tmdbId] = {
            wish: kind === 'wish' ? true : (prev[item.tmdbId]?.wish ?? false),
            watched:
              kind === 'watched' ? true : (prev[item.tmdbId]?.watched ?? false),
          };
        }
        return next;
      });
    },
    [kind],
  );

  useEffect(() => {
    if (!accessToken || !user) return;
    let cancelled = false;
    async function loadFirst() {
      setLoading(true);
      setError(null);
      setFlippedId(null);
      try {
        const res = await listUserMoviesRequest(
          accessToken!,
          kind,
          1,
          PAGE_SIZE,
        );
        if (cancelled) return;
        setItems(res.items);
        setPage(1);
        setHasMore(res.hasMore);
        setTotal(res.total);
        seedMarks(res.items);
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setHasMore(false);
          setTotal(0);
          setError(
            e instanceof Error ? e.message : '목록을 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadFirst();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user, kind, seedMarks]);

  const loadMore = useCallback(async () => {
    if (!accessToken || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await listUserMoviesRequest(
        accessToken,
        kind,
        nextPage,
        PAGE_SIZE,
      );
      setItems((prev) => [...prev, ...res.items]);
      setPage(nextPage);
      setHasMore(res.hasMore);
      setTotal(res.total);
      seedMarks(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '더 불러오지 못했습니다.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [accessToken, hasMore, kind, page, seedMarks]);

  useEffect(() => {
    const node = loadMoreTriggerRef.current;
    const root = scrollRef.current;
    if (!node || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { root, rootMargin: '120px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, items.length]);

  useEffect(() => {
    if (!accessToken || flippedId == null) return;
    let cancelled = false;
    async function loadMarks() {
      try {
        const res = await getUserMovieMarksRequest(accessToken!, flippedId!);
        if (!cancelled) {
          setMarksByTmdbId((prev) => ({
            ...prev,
            [res.tmdbId]: { wish: res.wish, watched: res.watched },
          }));
        }
      } catch {
        /* keep seeded */
      }
    }
    void loadMarks();
    return () => {
      cancelled = true;
    };
  }, [accessToken, flippedId]);

  async function toggleMark(tmdbId: number, markKind: UserMovieKind) {
    if (!accessToken) return;
    setError(null);

    const prevMarks = marksByTmdbId[tmdbId] ?? {
      wish: kind === 'wish',
      watched: kind === 'watched',
    };
    const prevItems = items;
    const prevTotal = total;
    const prevFlipped = flippedId;

    const turningOn =
      markKind === 'wish' ? !prevMarks.wish : !prevMarks.watched;
    const movingWishToWatched =
      kind === 'wish' && markKind === 'watched' && turningOn;

    let nextWish = markKind === 'wish' ? turningOn : prevMarks.wish;
    let nextWatched = markKind === 'watched' ? turningOn : prevMarks.watched;
    if (movingWishToWatched) {
      nextWish = false;
      nextWatched = true;
    }

    const leaveShelf = movingWishToWatched || (markKind === kind && !turningOn);

    setMarksByTmdbId((prev) => ({
      ...prev,
      [tmdbId]: { wish: nextWish, watched: nextWatched },
    }));
    if (leaveShelf) {
      setItems((prev) => prev.filter((item) => item.tmdbId !== tmdbId));
      setTotal((n) => Math.max(0, n - 1));
      setFlippedId((id) => (id === tmdbId ? null : id));
    }

    try {
      if (movingWishToWatched) {
        const tasks: Promise<unknown>[] = [
          toggleUserMovieRequest(accessToken, tmdbId, 'watched'),
        ];
        if (prevMarks.wish) {
          tasks.push(toggleUserMovieRequest(accessToken, tmdbId, 'wish'));
        }
        await Promise.all(tasks);
      } else {
        await toggleUserMovieRequest(accessToken, tmdbId, markKind);
      }
    } catch (error) {
      setMarksByTmdbId((prev) => ({ ...prev, [tmdbId]: prevMarks }));
      setItems(prevItems);
      setTotal(prevTotal);
      setFlippedId(prevFlipped);
      setError(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  }

  if (!user || !accessToken) {
    return (
      <main className="room room--shelf">
        <p className="room-copy">선반은 입장 후 이용할 수 있어요.</p>
        <div className="room-actions">
          <Link href="/login" className="lobby-btn lobby-btn--primary">
            입장하기
          </Link>
          <Link href="/room" className="lobby-btn">
            내 방으로
          </Link>
        </div>
      </main>
    );
  }

  const emptyLabel =
    kind === 'wish' ? '찜한 영화가 없어요.' : '본 작품이 없어요.';

  return (
    <main className="room room--shelf">
      <header className="room-shelf-header">
        <div className="room-shelf-heading">
          <p className="room-kicker">SHELF</p>
          <h1 className="room-shelf-title">
            {title}
            <span className="room-shelf-count">{total}</span>
          </h1>
        </div>
      </header>

      <div ref={scrollRef} className="room-shelf-scroll">
        {error ? <p className="room-copy">{error}</p> : null}

        {loading ? (
          <p className="room-copy">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="room-copy">{emptyLabel}</p>
        ) : (
          <ul className="room-movie-grid">
            {items.map((item) => {
              const movie = item.movie;
              const poster = tmdbPosterUrl(movie.poster_path, 'w342');
              const flipped = flippedId === item.tmdbId;
              const marks = marksByTmdbId[item.tmdbId];
              return (
                <li
                  key={`${item.tmdbId}-${item.updatedAt}`}
                  className="room-movie"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className={`room-flip${flipped ? ' is-flipped' : ''}`}
                    onClick={() =>
                      setFlippedId((id) =>
                        id === item.tmdbId ? null : item.tmdbId,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setFlippedId((id) =>
                          id === item.tmdbId ? null : item.tmdbId,
                        );
                      }
                    }}
                    aria-label={
                      flipped
                        ? `${movie.title} 포스터`
                        : `${movie.title} 줄거리`
                    }
                  >
                    <span className="room-flip-inner">
                      <span className="room-flip-face room-flip-face--front">
                        <span className="room-flip-poster">
                          {poster ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={poster} alt="" />
                          ) : (
                            <span className="room-flip-poster-empty">
                              No Poster
                            </span>
                          )}
                        </span>
                        <span className="room-flip-meta">
                          <span className="room-flip-title">{movie.title}</span>
                          <span className="room-flip-hint">탭해서 뒤집기</span>
                        </span>
                      </span>
                      <span className="room-flip-face room-flip-face--back">
                        <span className="room-flip-back-title">
                          {movie.title}
                        </span>
                        <span className="room-flip-facts">
                          <span>
                            {movie.release_date?.slice(0, 4) || '----'}
                          </span>
                          {movie.director ? (
                            <span>감독 · {movie.director}</span>
                          ) : null}
                        </span>
                        <span
                          className="room-flip-overview"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {movie.overview?.trim() || '줄거리 정보가 없어요.'}
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className="room-flip-marks">
                    <button
                      type="button"
                      className={`room-mark${marks?.wish ? ' is-on' : ''}`}
                      aria-pressed={marks?.wish ?? false}
                      aria-label={marks?.wish ? '찜 해제' : '찜'}
                      onClick={() => void toggleMark(item.tmdbId, 'wish')}
                    >
                      <Heart
                        size={14}
                        strokeWidth={1.75}
                        fill={marks?.wish ? 'currentColor' : 'none'}
                        aria-hidden
                      />
                    </button>
                    <button
                      type="button"
                      className={`room-mark${marks?.watched ? ' is-on' : ''}`}
                      aria-pressed={marks?.watched ?? false}
                      aria-label={marks?.watched ? '봤어요 해제' : '봤어요'}
                      onClick={() => void toggleMark(item.tmdbId, 'watched')}
                    >
                      <Check size={14} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div
          ref={loadMoreTriggerRef}
          className="room-shelf-load-more"
          aria-hidden
        />
        {loadingMore ? <p className="room-copy">더 불러오는 중…</p> : null}
      </div>

      <div className="room-actions room-actions--shelf">
        <Link href="/" className="lobby-btn">
          로비로
        </Link>
      </div>
    </main>
  );
}
