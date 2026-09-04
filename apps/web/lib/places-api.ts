import { apiFetch } from './api';

export type PlaceSearchResult = {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  placeUrl: string;
  longitude: number;
  latitude: number;
};

export function searchPlacesRequest(token: string, query: string) {
  const params = new URLSearchParams({ q: query.trim() });

  return apiFetch<PlaceSearchResult[]>(`/places/search?${params.toString()}`, {
    token,
  });
}
