const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

type TmdbPosterSize = 'w92' | 'w185' | 'w342' | 'w500';

export function tmdbPosterUrl(
  posterPath: string | null | undefined,
  size: TmdbPosterSize = 'w342',
) {
  if (!posterPath) return null;

  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}
