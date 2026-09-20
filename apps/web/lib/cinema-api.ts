import type { CinemaResponse } from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

export function getCinemasRequest(region: string) {
  const params = new URLSearchParams({ region });

  return apiFetch<CinemaResponse[]>(`/cinemas?${params.toString()}`);
}
