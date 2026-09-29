'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { MovieChartTrailerSkeleton } from '@/components/moviechart/MovieChartTrailerSkeleton';
import { useDialogFocusRestore } from '@/hooks/common/useDialogFocusRestore';

type MovieVideoModalProps = {
  title: string;
  videoUrl: string;
};

function getYoutubeEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const isYoutubeUrl =
      parsedUrl.hostname === 'youtu.be' ||
      parsedUrl.hostname === 'youtube.com' ||
      parsedUrl.hostname.endsWith('.youtube.com');

    if (!isYoutubeUrl) {
      return null;
    }

    const videoId =
      parsedUrl.searchParams.get('v') ??
      parsedUrl.pathname.split('/').filter(Boolean).pop();

    return videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
      : null;
  } catch {
    return null;
  }
}

function getKmdbPlayerUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.hostname === 'www.kmdb.or.kr' &&
      parsedUrl.pathname === '/trailer/trailerPlayPop'
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
}

export function MovieVideoModal({
  title,
  videoUrl,
}: MovieVideoModalProps) {
  const { handleOpenAutoFocus, handleCloseAutoFocus } = useDialogFocusRestore();
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoBlocked, setIsVideoBlocked] = useState(false);
  const videoEmbedUrl = getYoutubeEmbedUrl(videoUrl);
  const kmdbPlayerUrl = getKmdbPlayerUrl(videoUrl);
  const playerUrl = videoEmbedUrl ?? kmdbPlayerUrl;
  const videoId = videoEmbedUrl?.match(/embed\/([^?]+)/)?.[1] ?? null;
  const [thumbnailUrl, setThumbnailUrl] = useState(
    videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null,
  );
  const videoLabel = '예고편';

  useEffect(() => {
    if (!isVideoLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVideoBlocked(true);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [isVideoLoading]);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="movie-chart-trailer-backdrop" />
      <Dialog.Content
        className="movie-chart-trailer-modal"
        aria-describedby={undefined}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <Dialog.Close asChild>
          <button
            type="button"
            className="movie-chart-trailer-close"
            aria-label={`${videoLabel} 닫기`}
          >
            <X size={20} aria-hidden />
          </button>
        </Dialog.Close>

        <Dialog.Title asChild>
          <h2 className="movie-chart-trailer-title">
            <span>{title}</span>
            <span className="movie-chart-trailer-title-accent">
              {videoLabel}
            </span>
          </h2>
        </Dialog.Title>

        {playerUrl ? (
          <div className="movie-chart-trailer-video">
            {isVideoBlocked && thumbnailUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="movie-chart-trailer-fallback"
              >
                <Image
                  src={thumbnailUrl}
                  alt={`${title} ${videoLabel} 썸네일`}
                  width={480}
                  height={270}
                  className="movie-chart-trailer-thumbnail"
                  unoptimized
                  onError={() => {
                    if (!videoId || thumbnailUrl.endsWith('/hqdefault.jpg')) {
                      setThumbnailUrl(null);
                      return;
                    }

                    setThumbnailUrl(
                      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    );
                  }}
                />
                <span>YouTube에서 보기</span>
              </a>
            ) : isVideoBlocked ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="movie-chart-trailer-fallback"
              >
                <span>KMDb에서 {videoLabel} 보기</span>
              </a>
            ) : (
              <>
                {isVideoLoading ? <MovieChartTrailerSkeleton /> : null}
                <iframe
                  src={playerUrl}
                  title={`${title} ${videoLabel}`}
                  loading="eager"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={() => {
                    setIsVideoLoading(false);
                    setIsVideoBlocked(false);
                  }}
                />
              </>
            )}
          </div>
        ) : (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="movie-chart-trailer-fallback"
          >
            <span>KMDb에서 {videoLabel} 보기</span>
          </a>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
