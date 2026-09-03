'use client';

import {
  useDeferredValue,
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Search } from 'lucide-react';
import type { QuotePostItem } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import {
  listSavedQuotePostsRequest,
  unsaveQuotePostRequest,
} from '@/lib/quote-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import '../../styles/quote.css';
import '../../styles/room.css';
import '../../styles/lobby.css';
import QuoteFilmActions from '@/components/quote/QuoteFilmActions';
import QuoteActionModal from '@/components/quote/QuoteActionModal';

export default function SavedQuotePage() {
  const pageSize = 24;
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((s) => s.user);

  const [quotes, setQuotes] = useState<QuotePostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [quoteActionError, setQuoteActionError] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuotePostItem | null>(null);
  const [unsavingQuoteId, setUnsavingQuoteId] = useState<
    QuotePostItem['id'] | null
  >(null);
  const [quoteActionQuote, setQuoteActionQuote] =
    useState<QuotePostItem | null>(null);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    const token = accessToken;

    let cancelled = false;

    async function loadSavedQuotes() {
      try {
        setLoading(true);
        setNextCursor(null);
        const response = await listSavedQuotePostsRequest(token, pageSize, {
          search: deferredSearchQuery,
        });

        if (!cancelled) {
          setQuotes(response.items);
          setNextCursor(response.nextCursor);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSavedQuotes();

    return () => {
      cancelled = true;
    };
  }, [accessToken, deferredSearchQuery, hydrated]);

  async function loadMoreQuotes() {
    if (!accessToken || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const response = await listSavedQuotePostsRequest(accessToken, pageSize, {
        cursor: nextCursor,
        search: deferredSearchQuery,
      });
      setQuotes((current) => {
        const existingIds = new Set(current.map((quote) => quote.id));
        return [
          ...current,
          ...response.items.filter((quote) => !existingIds.has(quote.id)),
        ];
      });
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error('[SavedQuotePage] 다음 명대사 불러오기 실패:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleUnsaveQuote() {
    if (!accessToken || !quoteActionQuote) return;

    const quoteId = quoteActionQuote.id;
    setUnsavingQuoteId(quoteId);

    try {
      await unsaveQuotePostRequest(accessToken, quoteId);

      setQuotes((currentQuotes) =>
        currentQuotes.filter((quote) => quote.id !== quoteId),
      );
      setQuoteActionQuote(null);
    } catch {
      setQuoteActionQuote(null);
      setQuoteActionError(true);
    } finally {
      setUnsavingQuoteId(null);
    }
  }

  return (
    <main className="quote-page quote-page--saved">
      <nav className="room-shelf-nav" aria-label="페이지 이동">
        <Link href="/quote" className="room-top-nav-link">
          명대사방
        </Link>
        <Link href="/room" className="room-top-nav-link">
          MY CINEMA
        </Link>
      </nav>

      <header className="quote-header">
        <div className="quote-reel-heading">
          <Film size={22} aria-hidden />
          <div>
            <p className="quote-reel-kicker">CINEMO QUOTE COLLECTION</p>
            <h1 id="saved-quote-title">명대사 모음집</h1>
          </div>
        </div>
      </header>

      <div className="quote-saved-search-wrap">
        <label className="quote-saved-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="영화 제목·명대사·닉네임 검색"
            aria-label="영화 제목·명대사·닉네임 검색"
          />
        </label>
      </div>

      <section
        className="quote-reel-section"
        aria-labelledby="saved-quote-title"
      >
        {!hydrated || (loading && accessToken) ? (
          <p className="quote-film-empty">명대사 모음집을 불러오는 중…</p>
        ) : !accessToken ? (
          <p className="quote-film-empty">
            로그인 후 명대사 모음집을 볼 수 있어요.
          </p>
        ) : quotes.length === 0 ? (
          <p className="quote-film-empty">
            {deferredSearchQuery.trim()
              ? '검색 결과가 없어요.'
              : '아직 저장한 명대사가 없어요.'}
          </p>
        ) : (
          <div className="quote-film quote-film--grid">
            <div className="quote-film-track" role="list">
              {quotes.map((quote) => {
                const poster = quote.usePosterBackground
                  ? tmdbPosterUrl(quote.movie.poster_path, 'w342')
                  : null;

                return (
                  <article
                    key={quote.id}
                    className="quote-film-frame"
                    role="listitem"
                    style={
                      poster
                        ? ({
                            '--quote-poster-image': `url("${poster}")`,
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    {poster ? (
                      <Image
                        className="quote-film-poster"
                        src={poster}
                        alt=""
                        fill
                        sizes="(max-width: 30rem) calc(100vw - 1.3rem), (max-width: 48rem) 46vw, (max-width: 72rem) 30vw, 23vw"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <QuoteFilmActions
                      canManage={user?.id === quote.authorId}
                      isSaved
                      onSave={() => setQuoteActionQuote(quote)}
                      onEdit={() => setEditingQuote(quote)}
                    />
                    <div className="quote-film-frame-content">
                      <p
                        className={`quote-film-text${quote.text.length > 36 ? ' quote-film-text--long' : ''}${quote.text.length > 72 ? ' quote-film-text--extra-long' : ''}`}
                        title={quote.text}
                      >
                        {quote.text}
                      </p>

                      <footer className="quote-film-meta">
                        <strong>{quote.movie.title}</strong>
                        <small className="quote-film-author">
                          @{quote.nickname}
                        </small>
                      </footer>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {!loading && nextCursor ? (
          <button
            type="button"
            className="lobby-btn quote-load-more"
            onClick={() => void loadMoreQuotes()}
            disabled={loadingMore}
          >
            {loadingMore ? '불러오는 중…' : '더 보기'}
          </button>
        ) : null}
      </section>
      <QuoteActionModal
        isOpen={Boolean(quoteActionQuote)}
        mode="confirm"
        title="저장 취소"
        message={`"${quoteActionQuote?.movie.title ?? '이 명대사'}"를 모음집에서 뺄까요?`}
        confirmLabel="저장 취소"
        pendingLabel="취소 중…"
        onClose={() => {
          if (!unsavingQuoteId) {
            setQuoteActionQuote(null);
          }
        }}
        onConfirm={handleUnsaveQuote}
        isPending={unsavingQuoteId === quoteActionQuote?.id}
      />
      <QuoteActionModal
        isOpen={quoteActionError}
        mode="error"
        title="저장 취소 실패"
        message="명대사 저장을 취소하지 못했어요. 잠시 후 다시 시도해주세요."
        onClose={() => setQuoteActionError(false)}
      />
    </main>
  );
}
