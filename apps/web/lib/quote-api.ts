import type {
  CreateQuotePostInput,
  QuotePostItem,
  QuotePostPage,
} from '@cinemo/shared';
import { apiFetch } from './api';

type QuotePostListOptions = {
  cursor?: string | null;
  search?: string;
};

function listQuery(limit: number, options: QuotePostListOptions = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.search?.trim()) params.set('q', options.search.trim());
  return params.toString();
}

export function listQuotePostsRequest(
  limit = 24,
  token?: string | null,
  options?: QuotePostListOptions,
) {
  return apiFetch<QuotePostPage>(
    `/quote-posts?${listQuery(limit, options)}`,
    { token },
  );
}

export function listSavedQuotePostsRequest(
  token: string,
  limit = 24,
  options?: QuotePostListOptions,
) {
  return apiFetch<QuotePostPage>(
    `/quote-posts/saved?${listQuery(limit, options)}`,
    { token },
  );
}

export function createQuotePostRequest(
  token: string,
  input: CreateQuotePostInput,
) {
  return apiFetch<QuotePostItem>(`/quote-posts`, {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateQuotePostRequest(
  token: string,
  id: string,
  input: Partial<CreateQuotePostInput>,
) {
  return apiFetch<QuotePostItem>(`/quote-posts/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export function saveQuotePostRequest(token: string, id: string) {
  return apiFetch<{ saved: true }>(`/quote-posts/${id}/save`, {
    method: 'POST',
    token,
  });
}

export function deleteQuotePostRequest(token: string, id: string) {
  return apiFetch<{ delete: true }>(`/quote-posts/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function unsaveQuotePostRequest(token: string, id: string) {
  return apiFetch<{ saved: false }>(`/quote-posts/${id}/save`, {
    method: 'DELETE',
    token,
  });
}
