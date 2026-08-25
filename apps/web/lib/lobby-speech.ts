import type { TicketStatus } from '@cinemo/shared';

export function staffSpeech(
  nickname: string | undefined,
  status: TicketStatus | null,
  role?: 'user' | 'admin',
) {
  if (role === 'admin') return '관리자님, 오늘도 운영 확인하러 오셨네요~';
  if (!nickname) return '어서 오세요~ 입장하시면 티켓 드릴게요';
  if (status === 'issued') return `${nickname}님, 뽑기방 문이 열려 있어요~`;
  if (status === 'used') return `${nickname}님, 오늘도 즐거우셨나요~`;
  return `${nickname}님, 오늘 뽑기권 받아가세요~`;
}

export function guestTicketLabel(status: TicketStatus | null) {
  if (status === 'issued') return '발급됨 · 뽑기 가능';
  if (status === 'used') return '오늘 사용함';
  return '아직 없음';
}
