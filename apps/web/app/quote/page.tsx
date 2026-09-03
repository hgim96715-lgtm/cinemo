'use client';

import {
  useDeferredValue,
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Film, Plus, Search } from 'lucide-react';
import type { QuotePostItem, GachaMovie } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import {
  createQuotePostRequest,
  deleteQuotePostRequest,
  listQuotePostsRequest,
  saveQuotePostRequest,
  unsaveQuotePostRequest,
  updateQuotePostRequest,
} from '@/lib/quote-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import QuoteCreateModal from '@/components/quote/QuoteCreateModal';
import { searchMoviesRequest } from '@/lib/tmdb-api';
import '../styles/quote.css';
import '../styles/lobby.css';
import QuoteEditModal from '@/components/quote/QuoteEditModal';
import QuoteFilmActions from '@/components/quote/QuoteFilmActions';
import QuoteActionModal from '@/components/quote/QuoteActionModal';

export default function QuotePage() {
  const pageSize = 24;
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [quotes, setQuotes] = useState<QuotePostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<GachaMovie | null>(null);
  const [movieSearchResults, setMovieSearchResults] = useState<GachaMovie[]>(
    [],
  );
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuotePostItem | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<QuotePostItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [quoteSearch, setQuoteSearch] = useState('');
  const deferredQuoteSearch = useDeferredValue(quoteSearch);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function loadQuotes() {
      setLoading(true);
      setError(null);
      setNextCursor(null);
      try {
        const response = await listQuotePostsRequest(pageSize, accessToken, {
          search: deferredQuoteSearch,
        });
        if (!cancelled) {
          setQuotes(response.items);
          setNextCursor(response.nextCursor);
        }
      } catch {
        if (!cancelled) {
          setError('명대사를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadQuotes();
    return () => {
      cancelled = true;
    };
  }, [accessToken, deferredQuoteSearch, hydrated]);

  async function loadMoreQuotes() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const response = await listQuotePostsRequest(pageSize, accessToken, {
        cursor: nextCursor,
        search: deferredQuoteSearch,
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
      console.error('[QuotePage] 다음 명대사 불러오기 실패:', error);
      setActionError(
        '명대사를 더 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSearchMovies(query: string) {
    const normalizedQuery = query.trim();
    if (!accessToken || !normalizedQuery) {
      setMovieSearchResults([]);
      return;
    }
    setIsSearchingMovies(true);
    try {
      const response = await searchMoviesRequest(accessToken, normalizedQuery);
      setMovieSearchResults(response.results);
    } catch (error) {
      console.error('[QuotePage] 영화 검색 실패:', error);
      setMovieSearchResults([]);
    } finally {
      setIsSearchingMovies(false);
    }
  }

  function handleSelectMovie(movie: GachaMovie) {
    setSelectedMovie(movie);
    setMovieSearchResults([]);
  }

  async function handleCreateQuote(input: {
    tmdbId: number;
    text: string;
    usePosterBackground: boolean;
  }) {
    if (!accessToken) throw new Error('로그인이 필요합니다.');

    const createQuote = await createQuotePostRequest(accessToken, {
      tmdbId: input.tmdbId,
      text: input.text,
      usePosterBackground: input.usePosterBackground,
    });

    setQuotes((current) => [createQuote, ...current]);
    setIsCreateOpen(false);
    setSelectedMovie(null);
    setMovieSearchResults([]);
  }

  async function handleEditQuote(input: {
    text: string;
    usePosterBackground: boolean;
  }) {
    if (!accessToken || !editingQuote) {
      throw new Error('로그인이 필요합니다.');
    }

    const updatedQuote = await updateQuotePostRequest(
      accessToken,
      editingQuote.id,
      input,
    );

    setQuotes((current) =>
      current.map((quote) =>
        quote.id === updatedQuote.id ? updatedQuote : quote,
      ),
    );
    setEditingQuote(null);
  }

  async function handleDeleteQuote(id: string) {
    if (!accessToken) throw new Error('로그인이 필요합니다.');
    await deleteQuotePostRequest(accessToken, id);
    setQuotes((current) => current.filter((quote) => quote.id !== id));
  }

  async function confirmDeleteQuote() {
    if (!deletingQuote) return;

    setIsDeleting(true);
    try {
      await handleDeleteQuote(deletingQuote.id);
      setDeletingQuote(null);
    } catch (error) {
      console.error('[QuotePage] 명대사 삭제 실패:', error);
      setDeletingQuote(null);
      setActionError('명대사를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleSaveQuote(quote: QuotePostItem) {
    if (!accessToken) {
      setActionError('로그인이 필요합니다.');
      return;
    }
    try {
      const response = quote.isSaved
        ? await unsaveQuotePostRequest(accessToken, quote.id)
        : await saveQuotePostRequest(accessToken, quote.id);
      setQuotes((current) =>
        current.map((item) =>
          item.id === quote.id ? { ...item, isSaved: response.saved } : item,
        ),
      );
    } catch (error) {
      console.error('[QuotePage] 명대사 저장 실패:', error);
      setActionError('명대사를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <main className="quote-page">
      <header className="quote-header">
        <nav className="quote-page-nav" aria-label="명대사 페이지 이동">
          <Link href="/" className="quote-back-link">
            <ArrowLeft size={18} aria-hidden />
            로비
          </Link>
          <Link
            href="/room/quotes"
            className="quote-back-link quote-collection-link"
          >
            <Film size={17} aria-hidden />
            명대사 모음집
          </Link>
        </nav>

        <p className="quote-kicker">QUOTE FILM</p>
        <div className="quote-reel-heading">
          <Film size={22} aria-hidden />
          <div>
            <p className="quote-reel-kicker">CINEMO QUOTE ARCHIVE</p>
            <h1 id="quote-reel-title">명대사 필름</h1>
          </div>
        </div>
        <p className="quote-description">
          영화의 한 장면을 필름처럼 모아두는 공간
        </p>
        <label className="quote-search">
          <Search size={20} strokeWidth={1.6} aria-hidden />
          <input
            type="search"
            value={quoteSearch}
            onChange={(event) => setQuoteSearch(event.target.value)}
            placeholder="영화 제목·명대사·닉네임 검색"
            aria-label="영화 제목·명대사·닉네임 검색"
          />
        </label>
      </header>

      <section
        className="quote-reel-section"
        aria-labelledby="quote-reel-title"
      >
        {error ? (
          <p className="quote-film-error" role="alert">
            {error}
          </p>
        ) : loading ? (
          <p className="quote-film-empty">명대사를 불러오는 중…</p>
        ) : quotes.length === 0 ? (
          <div className="quote-empty-state">
            <p className="quote-empty-copy">
              {deferredQuoteSearch.trim()
                ? '검색 결과가 없어요.'
                : '아직 기록된 명대사가 없어요.'}
            </p>

            <div className="quote-film quote-film--empty">
              <div className="quote-film-holes" aria-hidden>
                {Array.from({ length: 12 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>

              <div className="quote-film-content">
                <button
                  type="button"
                  className="quote-add-button"
                  aria-label="명대사 남기기"
                  title="명대사 남기기"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={26} strokeWidth={1.6} aria-hidden />
                </button>
              </div>

              <div className="quote-film-holes" aria-hidden>
                {Array.from({ length: 12 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>
            </div>

            <p className="quote-empty-hint">
              좋아하는 장면을 첫 번째 필름에 남겨보세요.
            </p>
          </div>
        ) : (
          <div className="quote-film quote-film--grid">
            <div className="quote-film-track" role="list">
              <button
                type="button"
                className="quote-film-frame quote-film-frame--add"
                role="listitem"
                aria-label="명대사 추가"
                onClick={() => setIsCreateOpen(true)}
              >
                <span className="quote-film-frame-add-icon" aria-hidden>
                  <Plus size={30} strokeWidth={1.4} />
                </span>
                <span className="quote-film-frame-add-label">
                  명대사 남기기
                </span>
              </button>

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
                    <div className="quote-film-frame-content">
                      <QuoteFilmActions
                        canManage={currentUserId === quote.authorId}
                        isSaved={quote.isSaved}
                        onSave={() => void handleToggleSaveQuote(quote)}
                        onEdit={() => setEditingQuote(quote)}
                        onDelete={() => setDeletingQuote(quote)}
                      />
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
        {!loading && !error && nextCursor ? (
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
      <QuoteCreateModal
        isOpen={isCreateOpen}
        movies={movieSearchResults}
        selectedMovie={selectedMovie}
        isSearching={isSearchingMovies}
        onClose={() => {
          setIsCreateOpen(false);
          setMovieSearchResults([]);
        }}
        onSearchMovies={handleSearchMovies}
        onSelectMovie={handleSelectMovie}
        onSubmit={handleCreateQuote}
      />
      <QuoteEditModal
        isOpen={editingQuote !== null}
        quote={editingQuote}
        onClose={() => setEditingQuote(null)}
        onSubmit={handleEditQuote}
      />
      <QuoteActionModal
        isOpen={deletingQuote !== null}
        mode="confirm"
        title="이 장면을 지울까요?"
        message="삭제한 명대사는 다시 복구할 수 없어요."
        onClose={() => {
          if (!isDeleting) setDeletingQuote(null);
        }}
        onConfirm={confirmDeleteQuote}
        isPending={isDeleting}
      />
      <QuoteActionModal
        isOpen={actionError !== null}
        mode="error"
        title="삭제하지 못했어요"
        message={actionError ?? ''}
        onClose={() => setActionError(null)}
      />
    </main>
  );
}
