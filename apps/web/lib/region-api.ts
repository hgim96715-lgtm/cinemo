import type { RegionResponse } from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';

export function getRegionsRequest() {
  return apiFetch<RegionResponse[]>('/regions');
}
