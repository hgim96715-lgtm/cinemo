'use client';

import type { ReactNode } from 'react';
import { Film, Heart } from 'lucide-react';
import { CinemoNav } from '@/components/common/CinemoNav';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';

type Props = {
  kind: 'watched' | 'wish';
  title: string;
  children: ReactNode;
};

export function UserMovieShelfLayout({ kind, title, children }: Props) {
  const isWatched = kind === 'watched';

  return (
    <main className="my-cinema my-cinema--shelf">
      <CinemoPageHeader
        className="my-cinema-shelf-header"
        eyebrow={isWatched ? 'WATCHED' : 'WISH'}
        eyebrowClassName="my-cinema-kicker"
        leading={
          <span
            className={`my-cinema-shelf-leading${isWatched ? ' is-watched' : ' is-wish'}`}
            aria-hidden="true"
          >
            {isWatched ? (
              <Film size={22} strokeWidth={1.7} />
            ) : (
              <Heart size={22} strokeWidth={1.7} fill="currentColor" />
            )}
          </span>
        }
        description={
          isWatched
            ? '오늘의 관람을 한 장의 티켓처럼 남겨보세요'
            : '보고 싶은 영화를 한 장씩 모아보세요'
        }
        titleClassName="my-cinema-shelf-title"
        title={title}
        nav={
          <CinemoNav
            leftHref="/my-cinema"
            leftLabel="MY CINEMA"
            leftAriaLabel="MY CINEMA로 이동"
            showRightLink
            rightHref={isWatched ? '/my-cinema/wish' : '/my-cinema/watched'}
            rightLabel={isWatched ? 'WISH' : 'WATCHED'}
            rightAriaLabel={`${isWatched ? 'WISH' : 'WATCHED'}로 이동`}
          />
        }
      />

      <div className="my-cinema-shelf-scroll">{children}</div>
    </main>
  );
}
