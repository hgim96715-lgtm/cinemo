import { useRef } from 'react';

export function useDialogFocusRestore() {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  function handleOpenAutoFocus() {
    const activeElement = document.activeElement;
    previousActiveElementRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;
  }

  function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
    previousActiveElementRef.current?.focus();
  }

  return {
    handleOpenAutoFocus,
    handleCloseAutoFocus,
  };
}
