import type {
  CinemaAnalysisResponse,
  CinemaPageResponse,
  CinemaResponse,
} from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

export function getCinemasRequest(region?: string, page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (region?.trim()) {
    params.set('region', region.trim());
  }

  return apiFetch<CinemaPageResponse>(`/cinemas?${params.toString()}`);
}

export function searchCinemasRequest(query: string) {
  const params = new URLSearchParams({ query });

  return apiFetch<CinemaResponse[]>(`/cinemas/search?${params.toString()}`);
}

export function getCinemaAnalysisRequest() {
  return apiFetch<CinemaAnalysisResponse>('/cinemas/analysis');
}
