'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Heart } from 'lucide-react';
import type { PostcardCommentItem } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import {
  createPostcardCommentRequest,
  deletePostcardCommentRequest,
  getPostcardCommentsRequest,
  togglePostcardCommentReactionRequest,
  updatePostcardCommentRequest,
} from '@/lib/postcard-api';

type Props = {
  postcardId: string;
};

export function PostcardCommentSection({ postcardId }: Props) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [comments, setComments] = useState<PostcardCommentItem[]>([]);
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);

  const [showAllComments, setShowAllComments] = useState(false);
  const visibleComments = showAllComments ? comments : comments.slice(0, 5);

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        const response = await getPostcardCommentsRequest(postcardId, accessToken);

        if (!cancelled) {
          setComments(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '댓글을 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [accessToken, postcardId]);

  async function handleSubmit() {
    const trimmedText = text.trim();

    if (!trimmedText || submitting) return;

    if (!accessToken) {
      setLoginRequiredOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const comment = await createPostcardCommentRequest(
        accessToken,
        postcardId,
        trimmedText,
      );

      setComments((current) => [...current, comment]);
      setText('');
      setIsOpen(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : '댓글을 등록하지 못했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(parentId: string) {
    const trimmedText = replyText.trim();

    if (!trimmedText || submitting) return;

    if (!accessToken) {
      setLoginRequiredOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reply = await createPostcardCommentRequest(
        accessToken,
        postcardId,
        trimmedText,
        parentId,
      );

      setComments((current) =>
        current.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, reply] }
            : comment,
        ),
      );
      setExpandedReplies((current) => new Set(current).add(parentId));

      setReplyText('');
      setReplyTo(null);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : '답글을 등록하지 못했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCommentReaction(commentId: string) {
    if (!accessToken) {
      setLoginRequiredOpen(true);
      return;
    }

    try {
      const result = await togglePostcardCommentReactionRequest(
        accessToken,
        postcardId,
        commentId,
        '❤️',
      );

      setComments((current) =>
        current.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              reactionCount: Math.max(
                0,
                comment.reactionCount + (result.reacted ? 1 : -1),
              ),
              reacted: result.reacted,
            };
          }

          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    reactionCount: Math.max(
                      0,
                      reply.reactionCount + (result.reacted ? 1 : -1),
                    ),
                    reacted: result.reacted,
                  }
                : reply,
            ),
          };
        }),
      );
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : '하트를 반영하지 못했습니다.',
      );
    }
  }

  function updateCommentText(
    commentId: string,
    nextText: string,
  ) {
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? { ...comment, text: nextText }
          : {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId
                  ? { ...reply, text: nextText }
                  : reply,
              ),
            },
      ),
    );
  }

  async function handleEditComment(commentId: string) {
    const trimmedText = editingText.trim();

    if (!accessToken || !trimmedText || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await updatePostcardCommentRequest(
        accessToken,
        postcardId,
        commentId,
        trimmedText,
      );
      updateCommentText(commentId, trimmedText);
      setEditingCommentId(null);
      setEditingText('');
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : '댓글을 수정하지 못했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment() {
    if (!accessToken || !deletingCommentId || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await deletePostcardCommentRequest(
        accessToken,
        postcardId,
        deletingCommentId,
      );
      setComments((current) =>
        current
          .filter((comment) => comment.id !== deletingCommentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies.filter(
              (reply) => reply.id !== deletingCommentId,
            ),
          })),
      );
      setDeletingCommentId(null);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : '댓글을 삭제하지 못했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="postcard-comment-section" aria-label="댓글">
      <button
        type="button"
        className="postcard-comment-toggle"
        aria-expanded={isOpen}
        aria-label={isOpen ? '댓글 접기' : '댓글 펼치기'}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>댓글 {comments.length}</span>
        {isOpen ? (
          <ChevronUp size={15} strokeWidth={1.7} aria-hidden />
        ) : (
          <ChevronDown size={15} strokeWidth={1.7} aria-hidden />
        )}
      </button>

      {isOpen ? (
        <div className="postcard-comment-panel">
          <form
            className="postcard-comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <textarea
              value={text}
              maxLength={500}
              placeholder="이 엽서에 대한 생각을 남겨보세요."
              onChange={(event) => setText(event.target.value)}
            />
            <button type="submit" disabled={submitting || !text.trim()}>
              {submitting ? '등록 중...' : '댓글 남기기'}
            </button>
          </form>

          {error ? (
            <p className="postcard-comment-error" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p>댓글을 불러오는 중...</p>
          ) : comments.length === 0 ? (
            <p className="postcard-comment-empty">첫 댓글을 남겨보세요.</p>
          ) : (
            <div className="postcard-comment-list">
              {visibleComments.map((comment) => (
                <article className="postcard-comment" key={comment.id}>
                  <div className="postcard-comment-meta">
                    <strong>{comment.user.nickname}</strong>
                    <time dateTime={comment.createdAt}>
                      {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                    </time>
                  </div>

                  {editingCommentId === comment.id ? (
                    <form
                      className="postcard-comment-edit-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleEditComment(comment.id);
                      }}
                    >
                      <textarea
                        value={editingText}
                        maxLength={500}
                        onChange={(event) => setEditingText(event.target.value)}
                      />
                      <div className="postcard-comment-edit-actions">
                        <button type="submit" disabled={!editingText.trim() || submitting}>
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingText('');
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p>{comment.text}</p>
                  )}

                  <div className="postcard-comment-actions">
                    <button
                      type="button"
                      className={`postcard-comment-heart${comment.reacted ? ' is-reacted' : ''}`}
                      aria-label={comment.reacted ? '하트 취소' : '댓글에 하트'}
                      aria-pressed={comment.reacted}
                      onClick={() => void handleCommentReaction(comment.id)}
                    >
                      <Heart
                        size={14}
                        strokeWidth={1.8}
                        fill={comment.reacted ? 'currentColor' : 'none'}
                        aria-hidden
                      />
                      <span>{comment.reactionCount}</span>
                    </button>

                    {comment.userId === currentUserId ? (
                      <>
                        <button
                          type="button"
                          className="postcard-comment-text-button"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingText(comment.text);
                          }}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="postcard-comment-text-button is-danger"
                          onClick={() => setDeletingCommentId(comment.id)}
                        >
                          삭제
                        </button>
                      </>
                    ) : !comment.parentId ? (
                      <button
                        type="button"
                        className="postcard-comment-reply-button"
                        onClick={() =>
                          setReplyTo((current) =>
                            current === comment.id ? null : comment.id,
                          )
                        }
                      >
                        {replyTo === comment.id ? '답글 취소' : '답글 달기'}
                      </button>
                    ) : null}

                  </div>

                  {replyTo === comment.id ? (
                    <form
                      className="postcard-comment-reply-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleReplySubmit(comment.id);
                      }}
                    >
                      <input
                        value={replyText}
                        maxLength={500}
                        placeholder="답글을 남겨보세요."
                        onChange={(event) => setReplyText(event.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim() || submitting}
                      >
                        등록
                      </button>
                    </form>
                  ) : null}

                  {comment.replies.length > 0 ? (
                    <button
                      type="button"
                      className="postcard-comment-replies-toggle"
                      aria-expanded={expandedReplies.has(comment.id)}
                      onClick={() =>
                        setExpandedReplies((current) => {
                          const next = new Set(current);

                          if (next.has(comment.id)) {
                            next.delete(comment.id);
                          } else {
                            next.add(comment.id);
                          }

                          return next;
                        })
                      }
                    >
                      <span>답글 {comment.replies.length}개</span>
                      {expandedReplies.has(comment.id) ? (
                        <ChevronUp size={14} strokeWidth={1.7} aria-hidden />
                      ) : (
                        <ChevronDown
                          size={14}
                          strokeWidth={1.7}
                          aria-hidden
                        />
                      )}
                    </button>
                  ) : null}

                  {comment.replies.length > 0 && expandedReplies.has(comment.id) ? (
                    <div className="postcard-comment-replies">
                      {comment.replies.map((reply) => (
                        <div
                          className="postcard-comment-reply"
                          key={reply.id}
                        >
                          <div className="postcard-comment-reply-meta">
                            <strong>{reply.user.nickname}</strong>
                          </div>
                          {editingCommentId === reply.id ? (
                            <form
                              className="postcard-comment-edit-form"
                              onSubmit={(event) => {
                                event.preventDefault();
                                void handleEditComment(reply.id);
                              }}
                            >
                              <textarea
                                value={editingText}
                                maxLength={500}
                                onChange={(event) =>
                                  setEditingText(event.target.value)
                                }
                              />
                              <div className="postcard-comment-edit-actions">
                                <button
                                  type="submit"
                                  disabled={!editingText.trim() || submitting}
                                >
                                  저장
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingText('');
                                  }}
                                >
                                  취소
                                </button>
                              </div>
                            </form>
                          ) : (
                            <p>{reply.text}</p>
                          )}

                          {reply.userId === currentUserId ? (
                            <div className="postcard-comment-reply-actions">
                              <button
                                type="button"
                                className="postcard-comment-text-button"
                                onClick={() => {
                                  setEditingCommentId(reply.id);
                                  setEditingText(reply.text);
                                }}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                className="postcard-comment-text-button is-danger"
                                onClick={() => setDeletingCommentId(reply.id)}
                              >
                                삭제
                              </button>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            className={`postcard-comment-heart${reply.reacted ? ' is-reacted' : ''}`}
                            aria-label={
                              reply.reacted ? '하트 취소' : '답글에 하트'
                            }
                            aria-pressed={reply.reacted}
                            onClick={() =>
                              void handleCommentReaction(reply.id)
                            }
                          >
                            <Heart
                              size={13}
                              strokeWidth={1.8}
                              fill={reply.reacted ? 'currentColor' : 'none'}
                              aria-hidden
                            />
                            <span>{reply.reactionCount}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}

              {comments.length > 5 ? (
                <button
                  type="button"
                  className="postcard-comment-more"
                  onClick={() => setShowAllComments((current) => !current)}
                >
                  {showAllComments
                    ? '댓글 접기'
                    : `댓글 더보기 (${comments.length - 5})`}
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <ConfirmModal
        open={deletingCommentId !== null}
        eyebrow="POSTCARD"
        title="댓글을 삭제하시겠습니까?"
        description="삭제한 댓글은 다시 복구할 수 없습니다."
        confirmLabel={submitting ? '삭제 중...' : '삭제'}
        cancelLabel="취소"
        tone="danger"
        onConfirm={() => void handleDeleteComment()}
        onClose={() => {
          if (!submitting) setDeletingCommentId(null);
        }}
      />

      <ConfirmModal
        open={loginRequiredOpen}
        eyebrow="POSTCARD"
        title="로그인이 필요해요"
        description="댓글을 작성하거나 반응을 남기려면 로그인해 주세요."
        confirmLabel="로그인하기"
        cancelLabel="취소"
        onConfirm={() => {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          router.push(`/login?next=${encodeURIComponent(nextPath)}`);
          setLoginRequiredOpen(false);
        }}
        onClose={() => setLoginRequiredOpen(false)}
      />
    </section>
  );
}
