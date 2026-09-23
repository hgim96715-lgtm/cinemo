'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEventHandler } from 'react';

type CinemoNavProps = {
  leftLabel?: string;
  leftHref?: string;
  leftAriaLabel?: string;
  showLeftLink?: boolean;
  showRightLink?: boolean;
  rightHref?: string;
  rightLabel?: string;
  rightAriaLabel?: string;
  rightOnClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function CinemoNav({
  leftHref = '/',
  leftLabel = 'CINEMO LOBBY',
  leftAriaLabel = 'CINEMO LOBBY로 이동',
  showLeftLink = true,
  showRightLink = false,
  rightHref,
  rightLabel,
  rightAriaLabel,
  rightOnClick,
}: CinemoNavProps) {
  const pathname = usePathname();

  const hasLeftLink = showLeftLink && Boolean(leftHref && leftLabel);
  const hasRightLink = showRightLink && Boolean(rightHref && rightLabel);
  const isSingleLink = Number(hasLeftLink) + Number(hasRightLink) <= 1;

  return (
    <nav
      className={`cinemo-nav${isSingleLink ? ' cinemo-nav--single' : ''}`}
      aria-label="CINEMO 공통 메뉴"
    >
      {hasLeftLink ? (
        <Link
          href={leftHref}
          className="cinemo-nav-link"
          aria-label={leftAriaLabel ?? leftLabel}
          aria-current={pathname === leftHref ? 'page' : undefined}
        >
          {leftLabel}
        </Link>
      ) : null}

      {hasRightLink ? (
        <Link
          href={rightHref!}
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
