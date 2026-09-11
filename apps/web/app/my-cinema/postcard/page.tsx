'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Star, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import {
  CreatePostcardInput,
  createPostcardRequest,
  deletePostcardRequest,
  getBookmarkedPostcardsRequest,
  getMyPostcardsRequest,
  updatePostcardRequest,
  togglePostcardPinRequest,
  type PostcardSummary,
  togglePostcardBookmarkRequest,
} from '@/lib/postcard-api';
import { CinemoNav } from '@/components/common/CinemoNav';
import '../../styles/common.css';
import '../../styles/postcard.css';
import '../../styles/my-postcard.css';
import '../../styles/postcard-create-modal.css';
import '../../styles/confirm-modal.css';
import { PostcardCreateModal } from '@/components/postcard/PostcardCreateModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { PostcardListSkeleton } from '@/components/postcard/PostcardListSkeleton';

type Tab = 'mine' | 'bookmarked';

export default function MyPostcardPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [activeTab, setActiveTab] = useState<Tab>('mine');
  const [postcards, setPostcards] = useState<PostcardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPostcard, setEditingPostcard] =
    useState<PostcardSummary | null>(null);
  const [detailPostcard, setDetailPostcard] = useState<PostcardSummary | null>(
    null,
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pinLimitModalOpen, setPinLimitModalOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    const token = accessToken;
    async function loadPostcards() {
      try {
        setLoading(true);
        setError(null);
        const response =
          activeTab === 'mine'
            ? await getMyPostcardsRequest(token)
            : await getBookmarkedPostcardsRequest(token);
        if (!cancelled) {
          setPostcards(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '엽서를 불러오지 못했습니다.',
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
  }, [accessToken, activeTab]);

  useEffect(() => {
    if (!detailPostcard) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDetailPostcard(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailPostcard]);

  if (!hydrated) {
    return null;
  }

  if (!accessToken) {
    return (
      <main className="postcard-page my-postcard-page">
        <CinemoNav
          showRightLink={true}
          rightHref="/postcard"
          rightLabel="CINEMO POSTCARD"
          rightAriaLabel="CINEMO POSTCARD로 이동"
        />
        <header className="postcard-page-header">
          <p className="postcard-page-eyebrow">MY POSTCARD</p>
          <h1>내 엽서함</h1>
          <p>내가 만든 엽서와 보관한 엽서를 모아보세요.</p>
        </header>
        <ConfirmModal
          open={true}
          eyebrow="MY POSTCARD"
          title="로그인이 필요해요"
          description="내 엽서함을 이용하려면 로그인해 주세요."
          confirmLabel="로그인하기"
          cancelLabel="취소"
          onConfirm={() =>
            router.push('/login?next=/my-cinema/postcard')
          }
          onClose={() => router.push('/postcard')}
        />
      </main>
    );
  }
  async function handleCreatePostcard(input: CreatePostcardInput) {
    if (!accessToken) return;

    const createdPostcard = await createPostcardRequest(accessToken, input);

    setPostcards((current) => [createdPostcard, ...current]);
    setCreateModalOpen(false);
  }

  async function handleUpdatePostcard(input: CreatePostcardInput) {
    if (!accessToken || !editingPostcard) return;
    const updatedPostcard = await updatePostcardRequest(
      accessToken,
      editingPostcard.id,
      {
        movieTitle: input.movieTitle,
        originalText: input.originalText,
        text: input.text,
        posterPath: input.posterPath,
        isPublic: input.isPublic,
      },
    );
    setPostcards((current) =>
      current.map((postcard) =>
        postcard.id === updatedPostcard.id ? updatedPostcard : postcard,
      ),
    );
    setEditingPostcard(null);
  }

  async function handleTogglePinned(postcardId: string) {
    if (!accessToken) return;

    const postcard = postcards.find((item) => item.id === postcardId);
    const pinnedCount = postcards.filter((item) => item.isPinned).length;

    if (postcard && !postcard.isPinned && pinnedCount >= 3) {
      setPinLimitModalOpen(true);
      return;
    }

    const result = await togglePostcardPinRequest(accessToken, postcardId);

    setPostcards((current) =>
      current.map((postcard) =>
        postcard.id === postcardId
          ? { ...postcard, isPinned: result.isPinned }
          : postcard,
      ),
    );
  }

  async function handleDeletePostcard() {
    if (!accessToken || !deleteTargetId) return;

    await deletePostcardRequest(accessToken, deleteTargetId);

    setPostcards((current) =>
      current.filter((postcard) => postcard.id !== deleteTargetId),
    );

    setDeleteTargetId(null);
  }

  async function handleRemoveBookmark(postcardId: string) {
    if (!accessToken) return;

    await togglePostcardBookmarkRequest(accessToken, postcardId);

    setPostcards((current) =>
      current.filter((postcard) => postcard.id !== postcardId),
    );
  }

  return (
    <main className="postcard-page my-postcard-page">
      <CinemoNav
        showRightLink={true}
        rightHref="/postcard"
        rightLabel="CINEMO POSTCARD"
        rightAriaLabel="CINEMO POSTCARD로 이동"
      />

      <header className="postcard-page-header">
        <p className="postcard-page-eyebrow">MY POSTCARD</p>
        <h1>내 엽서함</h1>
        <p>내가 만든 엽서와 보관한 엽서를 모아보세요.</p>
      </header>

      <div
        className={`my-postcard-toolbar${
          activeTab === 'mine' ? ' has-create' : ''
        }`}
      >
        <div className="my-postcard-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mine'}
            className={activeTab === 'mine' ? 'is-active' : ''}
            onClick={() => setActiveTab('mine')}
          >
            내가 만든 엽서
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bookmarked'}
            className={activeTab === 'bookmarked' ? 'is-active' : ''}
            onClick={() => setActiveTab('bookmarked')}
          >
            보관한 엽서
          </button>
        </div>

        {activeTab === 'mine' ? (
          <button
            type="button"
            className="my-postcard-create-button"
            aria-label="엽서 만들기"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={19} strokeWidth={1.6} aria-hidden />
          </button>
        ) : null}
      </div>

      {loading ? (
        <PostcardListSkeleton />
      ) : error ? (
        <p className="postcard-empty">{error}</p>
      ) : postcards.length === 0 ? (
        <p className="postcard-empty">
          {activeTab === 'mine'
            ? '아직 만든 엽서가 없습니다.'
            : '아직 보관한 엽서가 없습니다.'}
        </p>
      ) : (
        <section className="postcard-grid" aria-label="내 엽서 목록">
          {postcards.map((postcard, index) => (
            <article className="postcard-card" key={postcard.id}>
              {postcard.posterPath ? (
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
              ) : null}

              <div className="postcard-card-content">
                <p className="postcard-card-movie">
                  {postcard.movieTitle ?? '제목 없는 영화'}
                </p>

                <div className="postcard-card-copy">
                  <p className="postcard-card-text">{postcard.text}</p>
                </div>

                {postcard.originalText ? (
                  <p className="postcard-card-original-text">
                    {postcard.originalText}
                  </p>
                ) : null}
                {postcard.text.length > 80 ||
                (postcard.originalText?.length ?? 0) > 100 ? (
                  <button
                    type="button"
                    className="postcard-card-more-button"
                    onClick={() => setDetailPostcard(postcard)}
                  >
                    더보기
                  </button>
                ) : null}

                <div className="postcard-card-meta">
                  <span>
                    {new Date(postcard.createdAt).toLocaleDateString('ko-KR')}
                  </span>

                  {activeTab === 'mine' ? (
                    <span>{postcard.isPublic ? '공개' : '비공개'}</span>
                  ) : (
                    <span>by {postcard.nickname}</span>
                  )}
                </div>
                {activeTab === 'mine' ? (
                  <div className="postcard-card-actions">
                    <button
                      type="button"
                      className={`cinemo-button postcard-card-pin-button${
                        postcard.isPinned ? ' is-pinned' : ''
                      }`}
                      aria-label={
                        postcard.isPinned
                          ? '대표 엽서 고정 해제'
                          : '대표 엽서로 고정'
                      }
                      aria-pressed={postcard.isPinned}
                      onClick={() => void handleTogglePinned(postcard.id)}
                    >
                      <Star
                        size={16}
                        strokeWidth={1.8}
                        fill={postcard.isPinned ? 'currentColor' : 'none'}
                        aria-hidden
                      />
                    </button>

                    <button
                      type="button"
                      className="cinemo-button postcard-card-edit-button"
                      onClick={() => setEditingPostcard(postcard)}
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      className="cinemo-button postcard-card-delete-button"
                      onClick={() => setDeleteTargetId(postcard.id)}
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <div className="postcard-card-actions">
                    <button
                      type="button"
                      className="cinemo-button postcard-card-bookmark-remove-button"
                      aria-label="보관한 엽서에서 제거"
                      onClick={() => void handleRemoveBookmark(postcard.id)}
                    >
                      보관 취소
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
      {detailPostcard ? (
        <div
          className="confirm-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailPostcard(null);
            }
          }}
        >
          <section
            className="confirm-modal postcard-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="postcard-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-modal-close"
              aria-label="문구 상세 모달 닫기"
              onClick={() => setDetailPostcard(null)}
            >
              <X size={18} aria-hidden />
            </button>

            <div className="postcard-detail-heading">
              <p className="postcard-detail-eyebrow">POSTCARD</p>
              <h2 id="postcard-detail-title">
                {detailPostcard.movieTitle ?? '제목 없는 영화'}
              </h2>
            </div>

            <div className="postcard-detail-body">
              {detailPostcard.posterPath ? (
                <div className="postcard-detail-poster">
                  <Image
                    src={detailPostcard.posterPath}
                    alt={`${detailPostcard.movieTitle ?? '영화'} 포스터`}
                    width={500}
                    height={750}
                  />
                </div>
              ) : null}

              <div className="postcard-detail-copy">
                <p className="postcard-detail-text">{detailPostcard.text}</p>
                {detailPostcard.originalText ? (
                  <p className="postcard-detail-original-text">
                    {detailPostcard.originalText}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
      <PostcardCreateModal
        open={createModalOpen || editingPostcard !== null}
        postcardToEdit={editingPostcard}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingPostcard(null);
        }}
        onSubmit={editingPostcard ? handleUpdatePostcard : handleCreatePostcard}
      />
      <ConfirmModal
        open={deleteTargetId !== null}
        eyebrow="POSTCARD"
        title="엽서를 삭제하시겠습니까?"
        description="삭제한 엽서는 다시 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        tone="danger"
        onConfirm={() => void handleDeletePostcard()}
        onClose={() => setDeleteTargetId(null)}
      />
      <ConfirmModal
        open={pinLimitModalOpen}
        eyebrow="POSTCARD"
        title="대표 엽서는 최대 3개까지 고정할 수 있어요."
        description="기존 대표 엽서의 별표를 해제한 뒤 다시 고정해 주세요."
        confirmLabel="확인"
        cancelLabel=""
        onConfirm={() => setPinLimitModalOpen(false)}
        onClose={() => setPinLimitModalOpen(false)}
      />
    </main>
  );
}
