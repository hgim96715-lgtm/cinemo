import { useQuery } from "@tanstack/react-query";

import { getMovieChart } from "../lib/movie-chart-api";

export function useMovieChart() {
  return useQuery({
    queryKey: ["movie-chart"],
    queryFn: getMovieChart,
  });
}
