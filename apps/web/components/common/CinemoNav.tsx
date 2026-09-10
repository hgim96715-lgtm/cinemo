'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEventHandler } from 'react';

type CinemoNavProps = {
  showRightLink?: boolean;
  rightHref?: string;
  rightLabel?: string;
  rightAriaLabel?: string;
  rightOnClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function CinemoNav({
  showRightLink = false,
  rightHref,
  rightLabel,
  rightAriaLabel,
  rightOnClick,
}: CinemoNavProps) {
  const pathname = usePathname();

  const isRightLinkActive = pathname === rightHref;

  return (
    <nav
      className={`cinemo-nav${showRightLink ? '' : ' cinemo-nav--single'}`}
      aria-label="CINEMO 공통 메뉴"
    >
      <Link
        href="/"
        className="cinemo-nav-link"
        aria-label="CINEMO LOBBY로 이동"
      >
        CINEMO LOBBY
      </Link>

      {showRightLink && rightHref && rightLabel ? (
        <Link
          href={rightHref}
          className={`cinemo-nav-link cinemo-nav-link--primary${
            pathname === rightHref ? ' is-active' : ''
          }`}
          aria-label={rightAriaLabel ?? rightLabel}
          aria-current={pathname === rightHref ? 'page' : undefined}
          onClick={rightOnClick}
        >
          {rightLabel}
        </Link>
      ) : null}
    </nav>
  );
}
