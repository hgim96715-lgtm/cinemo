'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import {
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
import { MovieDetailModalSkeleton } from './MovieDetailModalSkeleton';
import { CinemoNav } from '@/components/common/CinemoNav';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';
import { formatKstDateDots, kstYear } from '@/lib/date-kst';
import { getMovieDetailRequest } from '@/lib/tmdb-api';
import type { MovieDetail } from '@cinemo/api-contract';
import {
  CinemoSelect,
  type CinemoSelectOption,
} from '@/components/common/CinemoSelect';

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
    if (!accessToken) router.replace('/login?next=/my-cinema');
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

  const [selectedScreening, setSelectedScreening] =
    useState<UserMovieListItem | null>(null);
  const [selectedMovieDetail, setSelectedMovieDetail] =
    useState<MovieDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [marksByTmdbId, setMarksByTmdbId] = useState<
    Record<number, Pick<UserMovieMarks, 'wish' | 'watched'>>
  >({});
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const requestVersionRef = useRef(0);
  const detailRequestVersionRef = useRef(0);

  async function handleMovieDetailClick(item: UserMovieListItem) {
    const requestVersion = detailRequestVersionRef.current + 1;
    detailRequestVersionRef.current = requestVersion;
    setSelectedScreening(item);
    setSelectedMovieDetail(null);
    setLoadingDetailId(item.tmdbId);

    try {
      const detail = await getMovieDetailRequest(item.tmdbId);
      if (detailRequestVersionRef.current !== requestVersion) return;
      setSelectedMovieDetail(detail);
    } catch (error) {
      if (detailRequestVersionRef.current !== requestVersion) return;
      setError(
        error instanceof Error
          ? error.message
          : '영화 상세 정보를 불러오지 못했습니다.',
      );
      setSelectedScreening(null);
    } finally {
      if (detailRequestVersionRef.current === requestVersion) {
        setLoadingDetailId(null);
      }
    }
  }

  function formatWatchedAt(value: string | null) {
    if (!value) return null;
    return formatKstDateDots(value);
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
      if (selectedScreening?.tmdbId === tmdbId) {
        setSelectedScreening(null);
        setSelectedMovieDetail(null);
      }
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
      <main className="my-cinema my-cinema--shelf">
        <p className="my-cinema-copy my-cinema-message">
          MY CINEMA는 로그인 후 이용할 수 있어요.
        </p>
        <div className="my-cinema-actions">
          <Link href="/login" className="lobby-btn lobby-btn--primary">
            입장하기
          </Link>
          <Link href="/my-cinema" className="my-cinema-top-nav-link">
            MY CINEMA
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

  const currentKstYear = kstYear();
  const yearOptions: CinemoSelectOption[] = [
    { value: '', label: '전체 연도' },
    ...Array.from(
      { length: currentKstYear - 1999 },
      (_, index) => currentKstYear - index,
    ).map((year) => ({ value: String(year), label: `${year}년` })),
  ];
  const monthOptions: CinemoSelectOption[] = [
    { value: '', label: '전체 월' },
    ...Array.from({ length: 12 }, (_, index) => index + 1).map((month) => ({
      value: String(month),
      label: `${month}월`,
    })),
  ];

  return (
    <main className="my-cinema my-cinema--shelf">
      <CinemoPageHeader
        className="my-cinema-shelf-header"
        eyebrow={kind === 'watched' ? 'WATCHED' : 'WISHLIST'}
        eyebrowClassName="my-cinema-kicker"
        subtitle="CINEMO FILM ARCHIVE"
        titleClassName="my-cinema-shelf-title"
        title={
          <>
            {title}
            <span className="my-cinema-shelf-count">
              <span className="my-cinema-shelf-count-number">{total}</span>
              <span className="my-cinema-shelf-count-unit">편</span>
            </span>
          </>
        }
        nav={
          <CinemoNav
            rightHref="/my-cinema"
            rightLabel="MY CINEMA"
            rightAriaLabel="MY CINEMA로 이동"
          />
        }
      >
          <div className="my-cinema-shelf-toolbar">
            <div className="my-cinema-shelf-search">
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
              <div className="my-cinema-shelf-filters">
                <CinemoSelect
                  value={filterYear ? String(filterYear) : ''}
                  options={yearOptions}
                  ariaLabel="관람 연도 필터"
                  onChange={(value) =>
                    setFilterYear(value ? Number(value) : undefined)
                  }
                />
                <CinemoSelect
                  value={filterMonth ? String(filterMonth) : ''}
                  options={monthOptions}
                  ariaLabel="관람 월 필터"
                  onChange={(value) =>
                    setFilterMonth(value ? Number(value) : undefined)
                  }
                />
              </div>
            ) : null}
          </div>
      </CinemoPageHeader>

      <div ref={scrollRef} className="my-cinema-shelf-scroll">
        {error ? <p className="my-cinema-copy">{error}</p> : null}

        {loading ? (
          <p className="my-cinema-copy">불러오는 중…</p>
        ) : visibleItems.length === 0 ? (
          <p className="my-cinema-copy">{emptyLabel}</p>
        ) : (
          <ul className="my-cinema-movie-grid">
            {visibleItems.map((item) => {
              const movie = item.movie;
              const poster = tmdbPosterUrl(movie.poster_path, 'w342');
              const isDetailOpen = selectedScreening?.tmdbId === item.tmdbId;

              return (
                <li
                  key={`${item.tmdbId}-${item.updatedAt}`}
                  className="my-cinema-movie"
                >
                  <Dialog.Root
                    open={isDetailOpen}
                    onOpenChange={(open) => {
                      if (!open && isDetailOpen) {
                        setSelectedScreening(null);
                        setSelectedMovieDetail(null);
                      }
                    }}
                  >
                    <div className="my-cinema-movie-card-wrap">
                      <Dialog.Trigger asChild>
                        <button
                          type="button"
                          className="my-cinema-movie-card"
                          onClick={() => void handleMovieDetailClick(item)}
                          disabled={loadingDetailId === item.tmdbId}
                          aria-label={`${movie.title} 상세 보기`}
                        >
                          <div className="my-cinema-movie-poster">
                            {poster ? (
                              <Image
                                src={poster}
                                alt={`${movie.title} 포스터`}
                                fill
                                sizes="(max-width: 720px) 42vw, (max-width: 1100px) 24vw, 180px"
                              />
                            ) : (
                              <span className="my-cinema-movie-poster-empty">
                                No Poster
                              </span>
                            )}
                          </div>
                        </button>
                      </Dialog.Trigger>

                      <div className="my-cinema-movie-info">
                        <div className="my-cinema-movie-meta">
                          <span className="my-cinema-movie-title">
                            {movie.title}
                          </span>
                          {kind === 'watched' ? (
                            <div className="my-cinema-movie-screening-details">
                              {item.watchedAt ? (
                                <span className="my-cinema-movie-detail-chip is-date">
                                  <CalendarDays
                                    size={12}
                                    strokeWidth={1.7}
                                    aria-hidden
                                  />
                                  관람 {formatWatchedAt(item.watchedAt)}
                                </span>
                              ) : null}
                              {item.viewingLocation ? (
                                <span className="my-cinema-movie-detail-chip">
                                  <MapPin
                                    size={12}
                                    strokeWidth={1.7}
                                    aria-hidden
                                  />
                                  {item.viewingLocation}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="my-cinema-movie-facts">
                              <span className="my-cinema-movie-release-year">
                                개봉{' '}
                                {movie.release_date?.slice(0, 4) || '연도 없음'}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isDetailOpen && selectedScreening && selectedMovieDetail ? (
                      <MovieDetailModal
                        movie={selectedMovieDetail}
                        screening={selectedScreening}
                        marks={marksByTmdbId[selectedScreening.tmdbId]}
                        onToggleMark={(markKind) => {
                          void toggleMark(selectedScreening.tmdbId, markKind);
                        }}
                        onClose={() => {
                          setSelectedScreening(null);
                          setSelectedMovieDetail(null);
                        }}
                        onSaved={(details) => {
                          setItems((currentItems) =>
                            currentItems.map((item) =>
                              item.tmdbId === selectedScreening.tmdbId
                                ? { ...item, ...details }
                                : item,
                            ),
                          );

                          setSelectedScreening((currentScreening) =>
                            currentScreening
                              ? { ...currentScreening, ...details }
                              : currentScreening,
                          );
                        }}
                      />
                    ) : isDetailOpen && loadingDetailId === item.tmdbId ? (
                      <MovieDetailModalSkeleton />
                    ) : null}
                  </Dialog.Root>
                </li>
              );
            })}
          </ul>
        )}

        <div
          ref={loadMoreTriggerRef}
          className="my-cinema-shelf-load-more"
          aria-hidden
        />
        {loadingMore ? <p className="my-cinema-copy">더 불러오는 중…</p> : null}
      </div>
    </main>
  );
}
