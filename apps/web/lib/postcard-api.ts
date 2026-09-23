// apps/web/lib/postcard-api.ts

import type {
  PostcardCommentItem,
  PostcardDeleteResponse,
  PostcardItem,
  PostcardSummary,
  PostcardToggleBookmarkResponse,
  PostcardTogglePinnedResponse,
  PostcardToggleReactionResponse,
} from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

export type { PostcardSummary } from '@cinemo/api-contract';

export type CreatePostcardInput = {
  tmdbId: number;
  movieTitle?: string | null;
  originalText?: string | null;
  text: string;
  posterPath?: string | null;
  isPublic?: boolean;
};

export type UpdatePostcardInput = {
  movieTitle?: string | null;
  originalText?: string | null;
  text?: string;
  posterPath?: string | null;
  isPublic?: boolean;
};

export function getPublicPostcardsRequest(token?: string | null) {
  return apiFetch<PostcardItem[]>('/postcards', { token });
}

export function getMyPostcardsRequest(token: string) {
  return apiFetch<PostcardSummary[]>('/postcards/mine', { token });
}

export function getBookmarkedPostcardsRequest(token: string) {
  return apiFetch<PostcardSummary[]>('/postcards/bookmarked', { token });
}

export function createPostcardRequest(
  token: string,
  input: CreatePostcardInput,
) {
  return apiFetch<PostcardSummary>('/postcards', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updatePostcardRequest(
  token: string,
  postcardId: string,
  input: UpdatePostcardInput,
) {
  return apiFetch<PostcardSummary>(
    `/postcards/${encodeURIComponent(postcardId)}`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify(input),
    },
  );
}

export function deletePostcardRequest(token: string, postcardId: string) {
  return apiFetch<PostcardDeleteResponse>(
    `/postcards/${encodeURIComponent(postcardId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export function togglePostcardBookmarkRequest(
  token: string,
  postcardId: string,
) {
  return apiFetch<PostcardToggleBookmarkResponse>(
    `/postcards/${encodeURIComponent(postcardId)}/bookmark`,
    {
      method: 'POST',
      token,
    },
  );
}
export function togglePostcardPinRequest(token: string, postcardId: string) {
  return apiFetch<PostcardTogglePinnedResponse>(
    `/postcards/${encodeURIComponent(postcardId)}/pin`,
    {
      method: 'POST',
      token,
    },
  );
}

export function togglePostcardReactionRequest(
  token: string,
  postcardId: string,
  emoji: string,
) {
  return apiFetch<PostcardToggleReactionResponse>(
    `/postcards/${encodeURIComponent(postcardId)}/reaction`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({ emoji }),
    },
  );
}

export function getPostcardCommentsRequest(
  postcardId: string,
  token?: string | null,
) {
  return apiFetch<PostcardCommentItem[]>(
    `/postcards/${encodeURIComponent(postcardId)}/comments`,
    token ? { token } : undefined,
  );
}

export function createPostcardCommentRequest(
  token: string,
  postcardId: string,
  text: string,
  parentId?: string,
) {
  return apiFetch<PostcardCommentItem>(
    `/postcards/${encodeURIComponent(postcardId)}/comments`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({ text, parentId }),
    },
  );
}

export function updatePostcardCommentRequest(
  token: string,
  postcardId: string,
  commentId: string,
  text: string,
) {
  return apiFetch<PostcardCommentItem>(
    `/postcards/${encodeURIComponent(postcardId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify({ text }),
    },
  );
}

export function deletePostcardCommentRequest(
  token: string,
  postcardId: string,
  commentId: string,
) {
  return apiFetch<PostcardDeleteResponse>(
    `/postcards/${encodeURIComponent(postcardId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export function togglePostcardCommentReactionRequest(
  token: string,
  postcardId: string,
  commentId: string,
  emoji: string,
) {
  return apiFetch<PostcardToggleReactionResponse>(
    `/postcards/${encodeURIComponent(postcardId)}/comments/${encodeURIComponent(commentId)}/reaction`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({ emoji }),
    },
  );
}
