'use client';

import { Star } from 'lucide-react';
import '@/styles/home-ticket.css';

type HomeTicketToggleProps = {
  isDisplayed: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function HomeTicketToggle({
  isDisplayed,
  disabled = false,
  onToggle,
}: HomeTicketToggleProps) {
  return (
    <button
      type="button"
      className={`home-ticket-toggle${
        isDisplayed ? ' home-ticket-toggle--active' : ''
      }`}
      aria-label={isDisplayed ? '홈 티켓에서 제거' : '홈 티켓에 표시'}
      aria-pressed={isDisplayed}
      disabled={disabled}
      onClick={onToggle}
    >
      <Star
        size={17}
        strokeWidth={1.7}
        fill={isDisplayed ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    </button>
  );
}
