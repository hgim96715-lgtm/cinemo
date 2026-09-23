'use client';

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import Image from 'next/image';
import type { PostcardItem } from '@cinemo/api-contract';
import { useAuthStore } from '@/lib/auth-store';
import {
  getPublicPostcardsRequest,
  togglePostcardBookmarkRequest,
} from '@/lib/postcard-api';
import { CinemoNav } from '@/components/common/CinemoNav';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ErrorModal } from '@/components/common/ErrorModal';
import { PostcardReactionBar } from '@/components/postcard/PostcardReactionBar';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Images } from 'lucide-react';
import { PostcardCommentSection } from '@/components/postcard/PostcardCommentSection';
import { PostcardListSkeleton } from '@/components/postcard/PostcardListSkeleton';
import { formatKstDate } from '@/lib/date-kst';
import { getUserFacingErrorMessage } from '@/lib/get-user-facing-error-message';

export function PostcardPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [postcards, setPostcards] = useState<PostcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);

  const visiblePostcards = postcards.slice(0, visibleCount);

  const [bookmarkNotice, setBookmarkNotice] = useState<{
    postcardId: string;
    message: string;
  } | null>(null);
  const bookmarkNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    async function loadPostcards() {
      try {
        setLoading(true);
        setError(null);
        const response = await getPublicPostcardsRequest(accessToken);
        if (!cancelled) {
          setPostcards(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(
            getUserFacingErrorMessage(error, '엽서를 불러오지 못했습니다.'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadPostcards();
    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken]);

  async function handleBookmark(postcardId: string) {
    if (!accessToken) {
      setLoginRequiredOpen(true);
      return;
    }
    try {
      const { bookmarked } = await togglePostcardBookmarkRequest(
        accessToken,
        postcardId,
      );
      setPostcards((current) =>
        current.map((item) =>
          item.id === postcardId ? { ...item, isBookmarked: bookmarked } : item,
        ),
      );
      setBookmarkNotice({
        postcardId,
        message: bookmarked ? '저장되었습니다.' : '보관이 취소되었습니다.',
      });

      if (bookmarkNoticeTimer.current) {
        clearTimeout(bookmarkNoticeTimer.current);
      }

      bookmarkNoticeTimer.current = setTimeout(() => {
        setBookmarkNotice(null);
      }, 1600);
    } catch (error: unknown) {
      setError('엽서를 보관하지 못했습니다.');
    }
  }

  function handleMyPostcardClick(event: MouseEvent<HTMLAnchorElement>) {
    if (accessToken) return;

    event.preventDefault();
    setLoginRequiredOpen(true);
  }

  function handleLoginConfirm() {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
    setLoginRequiredOpen(false);
  }

  if (loading) {
    return (
      <main className="postcard-page postcard-public-page">
        <CinemoPageHeader
          className="postcard-page-header"
          eyebrow="CINEMO POSTCARD"
          eyebrowClassName="postcard-page-eyebrow"
          leading={
            <span className="postcard-page-leading" aria-hidden="true">
              <Images size={22} strokeWidth={1.7} />
            </span>
          }
          title="CINEMO 엽서"
          description="영화에서 기억할 문장을 한 장의 엽서로 남겨보세요."
          nav={
            <CinemoNav
              showRightLink
              rightHref="/my-cinema/postcard"
              rightLabel="MY POSTCARD"
              rightAriaLabel="MY POSTCARD로 이동"
              rightOnClick={handleMyPostcardClick}
            />
          }
        />
        <PostcardListSkeleton />
      </main>
    );
  }

  return (
    <main className="postcard-page postcard-public-page">
      {error ? (
        <ErrorModal
          open={Boolean(error)}
          eyebrow="FAIL"
          title="엽서 데이터 조회 실패"
          description={error}
          onClose={() => setError(null)}
        />
      ) : null}
      <CinemoPageHeader
        className="postcard-page-header"
        eyebrow="CINEMO POSTCARD"
        eyebrowClassName="postcard-page-eyebrow"
        leading={
          <span className="postcard-page-leading" aria-hidden="true">
            <Images size={22} strokeWidth={1.7} />
          </span>
        }
        title="CINEMO 엽서"
        description="영화에서 기억할 문장을 한 장의 엽서로 남겨보세요."
        nav={
          <CinemoNav
            showRightLink
            rightHref="/my-cinema/postcard"
            rightLabel="MY POSTCARD"
            rightAriaLabel="MY POSTCARD로 이동"
            rightOnClick={handleMyPostcardClick}
          />
        }
      />

      {postcards.length === 0 ? (
        <p className="postcard-empty">아직 공개된 엽서가 없습니다.</p>
      ) : (
        <section className="postcard-grid" aria-label="공개 엽서 목록">
          {visiblePostcards.map((postcard, index) => (
            <div className="postcard-card-group" key={postcard.id}>
              <article className="postcard-card">
                {postcard.posterPath && (
                  <div
                    className="postcard-card-poster"
                    aria-label={postcard.movieTitle ?? '영화 포스터'}
                  >
                    <Image
                      src={postcard.posterPath}
                      alt={`${postcard.movieTitle ?? '영화'} 포스터`}
                      width={500}
                      height={750}
                      sizes="(max-width: 640px) 100vw, 36vw"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                )}

                <div className="postcard-card-content">
                  <p className="postcard-card-movie">
                    {postcard.movieTitle ?? '제목 없는 영화'}
                  </p>

                  <p className="postcard-card-text">{postcard.text}</p>

                  <p
                    className="postcard-card-original-text"
                    aria-hidden={!postcard.originalText}
                  >
                    {postcard.originalText ?? ''}
                  </p>

                  <div className="postcard-card-meta">
                    <span>
                      {formatKstDate(postcard.createdAt)}
                    </span>
                    <span className="postcard-card-meta-author">
                      <span>by {postcard.nickname}</span>
                      <button
                        type="button"
                        className={`postcard-bookmark-button${
                          postcard.isBookmarked ? ' is-bookmarked' : ''
                        }`}
                        aria-label={
                          postcard.isBookmarked ? '보관 취소' : '엽서 보관'
                        }
                        aria-pressed={postcard.isBookmarked}
                        onClick={() => void handleBookmark(postcard.id)}
                      >
                        <Bookmark
                          size={15}
                          strokeWidth={1.8}
                          fill={postcard.isBookmarked ? 'currentColor' : 'none'}
                        />
                      </button>
                      {bookmarkNotice?.postcardId === postcard.id ? (
                        <span
                          className="postcard-bookmark-tooltip"
                          role="status"
                        >
                          {bookmarkNotice.message}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <div className="postcard-card-interactions">
                    <PostcardReactionBar
                      postcardId={postcard.id}
                      reactions={postcard.reactionCounts}
                      onChange={(reactionCounts) => {
                        setPostcards((current) =>
                          current.map((item) =>
                            item.id === postcard.id
                              ? { ...item, reactionCounts }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>
                </div>
              </article>
              <PostcardCommentSection postcardId={postcard.id} />
            </div>
          ))}
          {visibleCount < postcards.length && (
            <button
              type="button"
              className="postcard-load-more"
              onClick={() => setVisibleCount((count) => count + 5)}
            >
              더보기
            </button>
          )}
        </section>
      )}

      <ConfirmModal
        open={loginRequiredOpen}
        eyebrow="CINEMO"
        title="로그인이 필요해요"
        description="내 엽서함을 이용하거나 엽서에 댓글을 남기려면 로그인해 주세요."
        confirmLabel="로그인하기"
        onConfirm={handleLoginConfirm}
        onClose={() => setLoginRequiredOpen(false)}
      />
    </main>
  );
}
