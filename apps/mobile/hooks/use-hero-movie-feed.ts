import { useMemo } from "react";

import { useMovieChart } from "./use-movie-chart";
import { createHeroMovieFeed } from "../lib/hero-movie-feed";
import { toComingSoonHeroMovie, toHeroMovie } from "../lib/hero-movie-mapper";
import { useUpcomingMovies } from "./use-upcoming-movies";

export function useHeroMovieFeed() {
  const chartQuery = useMovieChart();
  const upcomingQuery = useUpcomingMovies();
  const chartMovies = chartQuery.data ?? [];
  const upcomingMovies = upcomingQuery.data ?? [];

  const heroMovies = useMemo(() => {
    return createHeroMovieFeed(
      chartMovies.map(toHeroMovie),
      upcomingMovies.map(toComingSoonHeroMovie),
    );
  }, [chartMovies, upcomingMovies]);

  return {
    data: heroMovies,
    chartMovies,
    upcomingMovies,
    isPending: chartQuery.isPending || upcomingQuery.isPending,
    isFetching: chartQuery.isFetching || upcomingQuery.isFetching,
    isError: chartQuery.isError || upcomingQuery.isError,
  };
}
