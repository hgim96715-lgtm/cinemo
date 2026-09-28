import { apiClient } from "./axios";

export type MovieChartItem = {
  rank: number;
  title: string;
  releaseDate: string | null;
  posterPath: string | null;
  trailerUrl: string | null;
  dailyAudienceCount: number;
  audienceCount: number;
};

type MovieChartResponse = {
  items: MovieChartItem[];
  targetDate: string;
  total: number;
};

export async function getMovieChart(): Promise<MovieChartItem[]> {
  const { data } = await apiClient.get<MovieChartResponse>(
    "/v1/lobby/movie-chart",
  );

  return data.items.sort((a, b) => a.rank - b.rank);
}
