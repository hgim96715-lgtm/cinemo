import type { MovieChartItem } from "./movie-chart-api";
import type { HeroMovie } from "../types/hero-movie";
import type { UpcomingMovieItem } from "./upcoming-movie-api";

export function toHeroMovie(movie: MovieChartItem): HeroMovie {
  return {
    id: `${movie.rank}-${movie.title}`,
    title: movie.title,
    posterPath: movie.posterPath,
    releaseDate: movie.releaseDate,
    rank: movie.rank,
    audienceCount: movie.audienceCount,
    source: "CHART",
  };
}

export function toComingSoonHeroMovie(movie: UpcomingMovieItem): HeroMovie {
  return {
    id: String(movie.tmdbId),
    title: movie.title,
    posterPath: movie.posterPath,
    releaseDate: movie.releaseDate,
    genres: movie.genres,
    source: "COMING_SOON",
  };
}
