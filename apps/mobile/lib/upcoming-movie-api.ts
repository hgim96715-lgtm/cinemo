import { apiClient } from "./axios";

export type UpcomingMovieItem = {
  tmdbId: number;
  title: string;
  releaseDate: string;
  posterPath: string | null;
  genres: string[];
  interestCount: number;
  isReleaseDateConfirmed: boolean;
};

type UpcomingMovieResponse = {
  items: UpcomingMovieItem[];
  total: number;
  hasNext: boolean;
};

function getCurrentMonth() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${today.getFullYear()}-${month}`;
}

export async function getUpcomingMovies(): Promise<UpcomingMovieItem[]> {
  const { data } = await apiClient.get<UpcomingMovieResponse>(
    "/v1/lobby/upcoming",
    {
      params: {
        month: getCurrentMonth(),
        page: 1,
        limit: 10,
      },
    },
  );
  return data.items;
}
