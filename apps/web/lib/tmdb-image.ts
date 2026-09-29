const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

type TmdbPosterSize = 'w92' | 'w185' | 'w342' | 'w500';

export function tmdbPosterUrl(
  posterPath: string | null | undefined,
  size: TmdbPosterSize = 'w342',
) {
  if (!posterPath) return null;

  // KMDb posterPath는 이미 완성된 절대 URL이므로 TMDB 경로를 붙이면 안 됨.
  if (/^https?:\/\//i.test(posterPath)) {
    return posterPath;
  }

  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}
