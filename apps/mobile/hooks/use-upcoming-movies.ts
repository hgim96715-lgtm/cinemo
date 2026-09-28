import { useQuery } from "@tanstack/react-query";

import { getUpcomingMovies } from "../lib/upcoming-movie-api";

export function useUpcomingMovies() {
  return useQuery({
    queryKey: ["upcoming-movies"],
    queryFn: getUpcomingMovies,
  });
}
