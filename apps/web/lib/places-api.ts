import { apiFetch } from './api-fetch';
import type { PlaceSearchResult } from '@cinemo/api-contract';

export function searchPlacesRequest(token: string, query: string) {
  const params = new URLSearchParams({ q: query.trim() });

  return apiFetch<PlaceSearchResult[]>(`/places/search?${params.toString()}`, {
    token,
  });
}
