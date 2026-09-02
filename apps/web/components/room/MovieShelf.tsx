'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, Heart, Search } from 'lucide-react';
import {
  GachaMovie,
  type UserMovieKind,
  type UserMovieListItem,
  type UserMovieMarks,
} from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import {
  listUserMoviesRequest,
  toggleUserMovieRequest,
} from '@/lib/user-movie-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { MovieDetailModal } from './MovieDetailModal';

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
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterMonth, setFilterMonth] = useState<number | undefined>();
  const [selectedMovie, setSelectedMovie] = useState<GachaMovie | null>(null);
  const [marksByTmdbId, setMarksByTmdbId] = useState<
    Record<number, Pick<UserMovieMarks, 'wish' | 'watched'>>
  >({});
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const requestVersionRef = useRef(0);

  function formatWatchedAt(value: string | null) {
    if (!value) return null;
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date(value))
      .replaceAll('-', '.');
  }

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
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!accessToken || !user) return;

    let cancelled = false;
    const token = accessToken;
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    async function loadFirst() {
      setLoading(true);
      setError(null);

      try {
        const res = await listUserMoviesRequest(token, kind, 1, PAGE_SIZE, {
          search: searchQuery,
          year: filterYear,
          month: filterMonth,
        });

        if (cancelled) return;

        setItems(res.items);
        setPage(1);
        setHasMore(res.hasMore);
        setTotal(res.total);
        seedMarks(res.items);
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          setHasMore(false);
          setTotal(0);
          setError(
            error instanceof Error
              ? error.message
              : '목록을 불러오지 못했습니다.',
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
  }, [
    accessToken,
    user,
    kind,
    searchQuery,
    filterYear,
    filterMonth,
    seedMarks,
  ]);

  const loadMore = useCallback(async () => {
    if (!accessToken || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const requestVersion = requestVersionRef.current;
    try {
      const nextPage = page + 1;
      const res = await listUserMoviesRequest(
        accessToken,
        kind,
        nextPage,
        PAGE_SIZE,
        {
          search: searchQuery,
          year: filterYear,
          month: filterMonth,
        },
      );
      if (requestVersion !== requestVersionRef.current) return;
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
  }, [
    accessToken,
    filterMonth,
    filterYear,
    hasMore,
    kind,
    page,
    searchQuery,
    seedMarks,
  ]);

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

  async function toggleMark(tmdbId: number, markKind: UserMovieKind) {
    if (!accessToken) return;
    setError(null);

    const prevMarks = marksByTmdbId[tmdbId] ?? {
      wish: kind === 'wish',
      watched: kind === 'watched',
    };
    const prevItems = items;
    const prevTotal = total;

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

  const visibleItems = items;

  const emptyLabel =
    searchQuery.trim() || filterYear || filterMonth
      ? '검색 결과가 없어요.'
      : kind === 'wish'
        ? '찜한 영화가 없어요.'
        : '본 작품이 없어요.';

  return (
    <main className="room room--shelf">
      <header className="room-shelf-header">
        <div className="room-shelf-heading">
          <p className="room-kicker">
            {kind === 'watched' ? 'WATCHED' : 'WISHLIST'}
          </p>
          <p className="room-shelf-subtitle">CINEMO FILM ARCHIVE</p>
          <h1 className="room-shelf-title">
            {title}
            <span className="room-shelf-count">
              <span className="room-shelf-count-number">{total}</span>
              <span className="room-shelf-count-unit">편</span>
            </span>
          </h1>
          <div className="room-shelf-toolbar">
            <div className="room-shelf-search">
              <Search size={18} strokeWidth={1.5} aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="영화 제목·감독·연도 검색"
                aria-label={`${title} 검색`}
              />
            </div>

            {kind === 'watched' ? (
              <div className="room-shelf-filters">
                <select
                  value={filterYear ?? ''}
                  onChange={(event) =>
                    setFilterYear(
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                  aria-label="관람 연도 필터"
                >
                  <option value="">전체 연도</option>
                  {Array.from(
                    {
                      length:
                        Number(
                          new Intl.DateTimeFormat('en-US', {
                            timeZone: 'Asia/Seoul',
                            year: 'numeric',
                          }).format(new Date()),
                        ) - 1999,
                    },
                    (_, index) => 2000 + index,
                  )
                    .reverse()
                    .map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                </select>

                <select
                  value={filterMonth ?? ''}
                  onChange={(event) =>
                    setFilterMonth(
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                  aria-label="관람 월 필터"
                >
                  <option value="">전체 월</option>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (month) => (
                      <option key={month} value={month}>
                        {month}월
                      </option>
                    ),
                  )}
                </select>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="room-shelf-scroll">
        {error ? <p className="room-copy">{error}</p> : null}

        {loading ? (
          <p className="room-copy">불러오는 중…</p>
        ) : visibleItems.length === 0 ? (
          <p className="room-copy">{emptyLabel}</p>
        ) : (
          <ul className="room-movie-grid">
            {visibleItems.map((item) => {
              const movie = item.movie;
              const poster = tmdbPosterUrl(movie.poster_path, 'w342');
              const marks = marksByTmdbId[item.tmdbId];
              return (
                <li
                  key={`${item.tmdbId}-${item.updatedAt}`}
                  className="room-movie"
                >
                  <div className="room-movie-card-wrap">
                    <button
                      type="button"
                      className="room-movie-card"
                      onClick={() => setSelectedMovie(movie)}
                      aria-label={`${movie.title} 상세 보기`}
                    >
                      <div className="room-movie-poster">
                        {poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={poster} alt={movie.title} />
                        ) : (
                          <span className="room-movie-poster-empty">
                            No Poster
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="room-movie-info">
                      <div className="room-movie-meta">
                        <span className="room-movie-title">{movie.title}</span>
                        <span className="room-movie-facts">
                          <span className="room-movie-release-year">
                            개봉{' '}
                            {movie.release_date?.slice(0, 4) || '연도 없음'}
                          </span>
                          {kind === 'watched' && item.watchedAt ? (
                            <span className="room-movie-watched-at">
                              <CalendarDays
                                size={12}
                                strokeWidth={1.7}
                                aria-hidden
                              />
                              <span>
                                관람 {formatWatchedAt(item.watchedAt)}
                              </span>
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <div className="room-movie-actions">
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
                          onClick={() =>
                            void toggleMark(item.tmdbId, 'watched')
                          }
                        >
                          <Check size={14} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </div>
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

      {selectedMovie ? (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      ) : null}

      <div className="room-actions room-actions--shelf">
        <Link href="/" className="lobby-btn">
          로비로
        </Link>
        <Link href="/room" className="lobby-btn">
          내방으로
        </Link>
      </div>
    </main>
  );
}
