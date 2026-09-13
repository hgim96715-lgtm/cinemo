import type {
  TicketStatus,
  TodayTicket,
  UseTicketResult,
} from '@cinemo/shared';
import { apiFetch } from './api-fetch';

export function getTodayTicketRequest(token: string) {
  return apiFetch<TodayTicket>('/tickets/today', { token });
}

export function issueTicketRequest(token: string) {
  return apiFetch<{ id: string }>('/tickets/issue', { method: 'POST', token });
}

export function useTicketRequest(token: string, machineId: string) {
  return apiFetch<UseTicketResult>('/tickets/use', {
    method: 'POST',
    token,
    body: JSON.stringify({ machineId }),
  });
}

export function resetTodayTicketRequest(token: string) {
  return apiFetch<{ status: TicketStatus }>('/tickets/reset-today', {
    method: 'POST',
    token,
  });
}
