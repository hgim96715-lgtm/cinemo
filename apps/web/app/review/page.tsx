'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import type { GachaMovie, ReviewPostItem } from '@cinemo/shared';
import {
  createReviewPostRequest,
  deleteReviewPostRequest,
  listReviewPostsRequest,
  toggleReviewPostLikeRequest,
  updateReviewPostRequest,
} from '@/lib/review-api';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { ArrowLeft, Heart, Star, X } from 'lucide-react';
import '../styles/review.css';
import { useAuthStore } from '@/lib/auth-store';
import { recordAnonReviewVisitRequest } from '@/lib/anon-api';
import { reviewPanelHint } from '@/lib/review-message';
import { kstDateKey } from '@/lib/date-kst';
import { capsuleLayout } from '@/lib/review-layout';
import { searchMoviesRequest } from '@/lib/tmdb-api';
import { normalizeSearchQuery } from '@/lib/search-query';

export default function ReviewPage() {
  const [posts, setPosts] = useState<ReviewPostItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const [promptOpen, setPromptOpen] = useState(false);
  const [writingOpen, setWritingOpen] = useState(false);
  const [openPost, setOpenPost] = useState<ReviewPostItem | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);
  const [ready, setReady] = useState(false);
  const [pickMovies, setPickMovies] = useState<GachaMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickQuery, setPickQuery] = useState('');
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);
  const [body, setBody] = useState<string>('');
  const [rating, setRating] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [flyingId, setFlyingId] = useState<string | null>(null);
  const [wroteThisVisit, setWroteThisVisit] = useState(false);
  const [coinInserting, setCoinInserting] = useState(false);

  const isMine = !!user && openPost?.nickname === user.nickname;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);

  const [likeAuthOpen, setLikeAuthOpen] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || accessToken) return;
    void recordAnonReviewVisitRequest().catch(() => undefined);
  }, [ready, accessToken]);

  useEffect(() => {
    let cancelled = false;
    async function loadPosts() {
      try {
        const response = await listReviewPostsRequest(120, accessToken);
        if (!cancelled) setPosts(response);
      } catch (error) {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : '데이터를 불러오는데 실패했습니다.',
          );
      }
    }
    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!writingOpen || !accessToken || editingId) return;

    const q = normalizeSearchQuery(pickQuery);

    if (q.length < 2) {
      setPickMovies([]);
      setSelectedTmdbId(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await searchMoviesRequest(accessToken, q);
        if (cancelled) return;
        const list = response.results.slice(0, 6);
        setPickMovies(list);
        setSelectedTmdbId((prev) =>
          prev != null && list.some((m) => m.id === prev)
            ? prev
            : (list[0]?.id ?? null),
        );
      } catch (error) {
        if (!cancelled) {
          setPickMovies([]);
          setSelectedTmdbId(null);
          setError(
            error instanceof Error
              ? error.message
              : '검색 결과를 불러오는데 실패했어요.',
          );
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessToken, pickQuery, writingOpen, editingId]);

  function resetWriteForm() {
    setEditingId(null);
    setEditingTitle(null);
    setWritingOpen(false);
    setBody('');
    setRating(3);
    setPickMovies([]);
    setPickQuery('');
    setSelectedTmdbId(null);
  }

  async function submitPost() {
    if (!accessToken) return;
    if (!body.trim()) {
      setError('후기를 입력해주세요.');
      return;
    }
    if (!editingId && selectedTmdbId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        const post = await updateReviewPostRequest(accessToken, editingId, {
          body: body.trim(),
          rating,
        });
        setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
        resetWriteForm();
        setOpenPost(post);
        return;
      }
      const post = await createReviewPostRequest(accessToken, {
        tmdbId: selectedTmdbId!,
        body: body.trim(),
        rating,
      });
      resetWriteForm();
      setPosts((prev) => [post, ...prev]);
      setWroteThisVisit(true);
      setFlyingId(post.id);
      window.setTimeout(() => setFlyingId(null), 900);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '후기 저장에 실패했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const visiblePicks = pickMovies;
  const pickQueryTrimmed = normalizeSearchQuery(pickQuery);

  const todayKey = kstDateKey();
  const postedToday = Boolean(
    wroteThisVisit ||
    (user &&
      posts.some(
        (p) =>
          p.nickname === user.nickname &&
          kstDateKey(new Date(p.createdAt)) === todayKey,
      )),
  );
  const panelHint = !user
    ? '볼을 눌러 구경하거나, 입장 후 후기를 남겨 보세요'
    : reviewPanelHint(postedToday);
  const ballSize = posts.length > 12 ? 'sm' : posts.length > 4 ? 'md' : 'lg';
  const chamberMinRem = Math.max(
    18,
    16 + Math.min(10, Math.ceil(Math.sqrt(Math.max(posts.length, 1)))) * 1.6,
  );

  async function onDelete() {
    if (!accessToken || !openPost) return;
    setError(null);
    try {
      await deleteReviewPostRequest(accessToken, openPost.id);
      setPosts((prev) => prev.filter((p) => p.id !== openPost.id));
      setOpenPost(null);
      setWroteThisVisit(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '후기 삭제에 실패했습니다.',
      );
    }
  }

  function startEdit() {
    if (!openPost) return;
    setEditingId(openPost.id);
    setEditingTitle(openPost.movie.title);
    setSelectedTmdbId(openPost.tmdbId);
    setBody(openPost.body);
    setRating(openPost.rating);
    setOpenPost(null);
    setWritingOpen(true);
  }

  async function onToggleLike() {
    if (!openPost) return;
    if (!accessToken) {
      setLikeAuthOpen(true);
      return;
    }
    if (isMine) return;
    const res = await toggleReviewPostLikeRequest(accessToken, openPost.id);
    setOpenPost({
      ...openPost,
      likeCount: res.likeCount,
      likedByMe: res.likedByMe,
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === openPost.id
          ? { ...p, likeCount: res.likeCount, likedByMe: res.likedByMe }
          : p,
      ),
    );
  }

  return (
    <main className="review">
      <header className="review-top">
        {user?.role === 'admin' ? (
          <>
            <Link href="/admin" className="review-back">
              <ArrowLeft size={16} aria-hidden />
              관리자 화면
            </Link>
            <Link href="/?lobby=1" className="review-back">
              <ArrowLeft size={16} aria-hidden />
              로비
            </Link>
          </>
        ) : (
          <Link href="/" className="review-back">
            <ArrowLeft size={16} aria-hidden />
            로비
          </Link>
        )}
      </header>
      {error ? <p className="review-error">{error}</p> : null}

      <div className="review-room">
        <div className="review-cabinet">
          <div className="review-cabinet-marquee">
            <div className="review-cabinet-titles">
              <span className="review-cabinet-brand">REVIEW BALL</span>
              <h1 className="review-cabinet-title">후기방</h1>
            </div>
            <span className="review-cabinet-count">{posts.length}</span>
          </div>
          <div className="review-cabinet-glass">
            <div
              className={`review-machine review-machine--${ballSize}`}
              role="list"
              style={{ minHeight: `${chamberMinRem}rem` }}
            >
              {posts.length === 0 ? (
                <p className="review-machine-empty">아직 볼이 없어요</p>
              ) : (
                posts.map((post, index) => {
                  const layout = capsuleLayout(
                    post.id,
                    index,
                    posts.length,
                    ballSize,
                  );
                  return (
                    <button
                      key={post.id}
                      type="button"
                      role="listitem"
                      className={`review-capsule review-capsule--${ballSize}${flyingId === post.id ? ' is-flying' : ''}`}
                      style={
                        {
                          left: layout.left,
                          top: layout.top,
                          '--review-cap-hue': layout.hue,
                          '--review-cap-delay': layout.delay,
                          '--review-cap-rot': layout.rotate,
                          '--review-cap-scale': layout.scale,
                          zIndex: layout.z,
                        } as CSSProperties
                      }
                      onClick={() => setOpenPost(post)}
                      aria-label={`${post.movie.title} 후기 열기`}
                    >
                      <span className="review-capsule-shell" aria-hidden />
                      <span className="review-capsule-title">
                        {post.movie.title}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="review-cabinet-shine" aria-hidden />
          </div>

          <div className="review-cabinet-panel">
            <p className="review-panel-hint" key={panelHint}>
              {panelHint}
            </p>
            <button
              type="button"
              className={`review-coin-insert${coinInserting ? ' is-inserting' : ''}${postedToday ? ' is-spent' : ''}`}
              disabled={coinInserting || postedToday}
              aria-label={postedToday ? '오늘 후기 완료' : '후기 넣기'}
              onClick={() => {
                if (coinInserting || postedToday) return;
                setCoinInserting(true);
                window.setTimeout(() => {
                  setCoinInserting(false);
                  setPromptOpen(true);
                }, 520);
              }}
            >
              <span className="review-coin-slot" aria-hidden>
                <span className="review-coin-slot-lip" />
                <span className="review-coin-slot-mouth" />
                <span className="review-coin" />
              </span>
              <span className="review-coin-copy">
                <span className="review-coin-kicker">
                  {postedToday ? 'DONE TODAY' : 'INSERT COIN'}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {openPost ? (
        <div
          className="review-prompt-overlay"
          onClick={() => setOpenPost(null)}
        >
          <div
            className="review-capsule-open"
            role="dialog"
            aria-modal="true"
            aria-label="후기"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="review-capsule-open-close"
              aria-label="닫기"
              onClick={() => setOpenPost(null)}
            >
              <X size={18} strokeWidth={2} />
            </button>
            <p className="review-capsule-open-kicker">GACHA BALL</p>
            <div className="review-capsule-open-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  tmdbPosterUrl(openPost.movie.poster_path, 'w185') ?? undefined
                }
                alt=""
              />
              <div>
                <p className="review-capsule-open-title">
                  {openPost.movie.title}
                </p>
                <p className="review-capsule-open-meta">
                  {openPost.nickname} · ★ {openPost.rating}
                </p>
              </div>
            </div>
            <p className="review-capsule-open-body">{openPost.body}</p>
            <div className="review-capsule-open-actions">
              {isMine ? (
                <>
                  <button
                    type="button"
                    className="review-ink-btn review-ink-btn--primary"
                    onClick={startEdit}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="review-ink-btn"
                    onClick={() => void onDelete()}
                  >
                    삭제
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className={`review-capsule-open-like${openPost.likedByMe ? ' is-on' : ''}${isMine ? ' is-mine' : ''}`}
                aria-label={isMine ? '받은 좋아요' : '좋아요'}
                aria-pressed={openPost.likedByMe}
                disabled={isMine}
                onClick={() => void onToggleLike()}
              >
                <Heart
                  size={18}
                  strokeWidth={1.75}
                  fill={openPost.likedByMe ? 'currentColor' : 'none'}
                />
                <span>{openPost.likeCount}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {promptOpen ? (
        <div
          className="review-prompt-overlay"
          onClick={() => setPromptOpen(false)}
        >
          <div
            className="review-prompt"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="review-prompt-kicker">후기방</p>
            <p className="review-prompt-title">영화 재미있게 잘 보셨나요?</p>
            <p className="review-prompt-copy">후기 남기시겠어요?</p>
            <div className="review-prompt-actions">
              {user ? (
                <button
                  type="button"
                  className="review-ink-btn review-ink-btn--primary"
                  onClick={() => {
                    setPromptOpen(false);
                    setEditingId(null);
                    setEditingTitle(null);
                    setBody('');
                    setRating(3);
                    setWritingOpen(true);
                  }}
                >
                  남길래요
                </button>
              ) : (
                <Link
                  href="/login"
                  className="review-ink-btn review-ink-btn--primary"
                >
                  입장하기
                </Link>
              )}
              <button
                type="button"
                className="review-ink-btn"
                onClick={() => setPromptOpen(false)}
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {writingOpen ? (
        <div
          className="review-write-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? '후기 수정' : '후기 작성'}
          onClick={resetWriteForm}
        >
          <div
            className={`review-paper${editingId ? ' review-paper--edit' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="review-paper-close"
              aria-label="닫기"
              onClick={resetWriteForm}
            >
              <X size={18} strokeWidth={2} />
            </button>
            <p className="review-paper-kicker">
              {editingId ? 'REVIEW BALL' : '오늘의 쪽지'}
            </p>
            {editingId ? (
              <>
                <p className="review-paper-locked">{editingTitle}</p>
                <p className="review-paper-edit-label">후기 수정</p>
              </>
            ) : (
              <>
                <p className="review-paper-label">영화</p>
                <input
                  className="review-paper-search"
                  type="search"
                  value={pickQuery}
                  onChange={(e) => setPickQuery(e.target.value)}
                  placeholder="영화 제목 검색"
                />
                <div className="review-paper-picks">
                  {pickQueryTrimmed.length < 2 ? (
                    <p className="review-paper-empty">
                      2글자 이상 입력해 주세요.
                    </p>
                  ) : searching ? (
                    <p className="review-paper-empty">검색 중…</p>
                  ) : visiblePicks.length === 0 ? (
                    <p className="review-paper-empty">검색 결과가 없어요.</p>
                  ) : (
                    visiblePicks.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        className={`review-pick${selectedTmdbId === movie.id ? ' is-on' : ''}`}
                        onClick={() => setSelectedTmdbId(movie.id)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            tmdbPosterUrl(movie.poster_path, 'w185') ??
                            undefined
                          }
                          alt=""
                        />
                        <span>{movie.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
            <p className="review-paper-label">별점</p>
            <div className="review-paper-rating" role="group" aria-label="별점">
              {[1, 2, 3, 4, 5].map((n) => {
                const fill = rating >= n ? 100 : rating >= n - 0.5 ? 50 : 0;
                return (
                  <span key={n} className="review-star-slot">
                    <button
                      type="button"
                      className="review-star-hit review-star-hit--left"
                      aria-label={`${n - 0.5}점`}
                      onClick={() => setRating(n - 0.5)}
                    />
                    <button
                      type="button"
                      className="review-star-hit review-star-hit--right"
                      aria-label={`${n}점`}
                      onClick={() => setRating(n)}
                    />
                    <span className="review-star-face" aria-hidden>
                      <Star
                        className="review-star-outline"
                        size={26}
                        strokeWidth={1.5}
                      />
                      <span
                        className="review-star-fill"
                        style={{ width: `${fill}%` }}
                      >
                        <Star size={26} strokeWidth={1.5} fill="currentColor" />
                      </span>
                    </span>
                  </span>
                );
              })}
            </div>
            <p className="review-paper-label">후기</p>
            <textarea
              className="review-paper-body"
              placeholder="만년필로 적듯, 짧게…"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="review-paper-actions">
              <button
                type="button"
                className="review-ink-btn review-ink-btn--primary"
                disabled={submitting || (!editingId && selectedTmdbId == null)}
                onClick={() => void submitPost()}
              >
                {editingId ? '저장' : '완성'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {likeAuthOpen ? (
        <div
          className="review-prompt-overlay"
          onClick={() => setLikeAuthOpen(false)}
        >
          <div
            className="review-like-auth"
            role="dialog"
            aria-modal="true"
            aria-label="입장 안내"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="review-like-auth-icon" aria-hidden>
              <Heart size={22} strokeWidth={1.6} />
            </span>
            <p className="review-like-auth-kicker">REVIEW BALL</p>
            <p className="review-like-auth-title">마음에 드셨나요?!</p>
            <p className="review-like-auth-copy">
              좋아요는 입장한 뒤에 남길 수 있어요.
            </p>
            <div className="review-like-auth-actions">
              <button
                type="button"
                className="review-ink-btn"
                onClick={() => setLikeAuthOpen(false)}
              >
                나중에
              </button>
              <Link
                href="/login"
                className="review-ink-btn review-ink-btn--primary"
              >
                입장하기
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
