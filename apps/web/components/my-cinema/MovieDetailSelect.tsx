'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type MovieDetailSelectOption = {
  value: string;
  label: string;
};

export type MovieDetailSelectProps = {
  value: string;
  options: readonly MovieDetailSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
};

export function MovieDetailSelect({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: MovieDetailSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <div
      className={`movie-detail-select${open ? ' is-open' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="movie-detail-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        disabled={disabled}
      >
        <span>{selectedOption?.label ?? '선택 안 함'}</span>
        <ChevronDown size={18} strokeWidth={1.7} aria-hidden />
      </button>

      {open ? (
        <div
          className="movie-detail-select-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => (
            <button
              key={option.value || 'empty'}
              type="button"
              className="movie-detail-select-option"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
