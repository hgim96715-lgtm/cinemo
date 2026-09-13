import type { LobbyGuide, UpdateLobbyGuideInput } from '@cinemo/shared';
import { apiFetch } from './api-fetch';

export function getLobbyGuideRequest() {
  return apiFetch<LobbyGuide>('/guide');
}

export function updateLobbyGuideRequest(
  token: string,
  input: UpdateLobbyGuideInput,
) {
  return apiFetch<LobbyGuide>('/guide', {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}
