'use client';

import { Bookmark, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

type QuoteFilmActionsProps = {
  canManage: boolean;
  isSaved: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDelete?: () => void;
};

export default function QuoteFilmActions({
  canManage,
  isSaved,
  onSave,
  onEdit,
  onDelete,
}: QuoteFilmActionsProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const menu = menuRef.current;

      if (menu && !menu.contains(event.target as Node)) {
        menu.removeAttribute('open');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        menuRef.current?.removeAttribute('open');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeMenu = () => {
    menuRef.current?.removeAttribute('open');
  };

  return (
    <details ref={menuRef} className="quote-film-actions">
      <summary
        className="quote-film-actions-trigger"
        aria-label="명대사 메뉴 열기"
      >
        <Ellipsis size={18} strokeWidth={1.7} aria-hidden />
      </summary>

      <div className="quote-film-actions-menu" role="menu">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            closeMenu();
            onSave();
          }}
        >
          <Bookmark
            size={15}
            strokeWidth={1.7}
            fill={isSaved ? 'currentColor' : 'none'}
            aria-hidden
          />
          {isSaved ? '저장 취소' : '저장하기'}
        </button>

        {canManage && onDelete && (
          <button
            type="button"
            role="menuitem"
            className="quote-film-actions-delete"
            onClick={() => {
              closeMenu();
              onDelete();
            }}
          >
            <Trash2 size={15} aria-hidden />
            삭제하기
          </button>
        )}
      </div>
    </details>
  );
}
