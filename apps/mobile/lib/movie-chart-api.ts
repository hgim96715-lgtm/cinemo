const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3050";

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
  const response = await fetch(`${API_URL}/v1/lobby/movie-chart`);

  if (!response.ok) {
    throw new Error(`영화 차트 조회 실패: ${response.status}`);
  }

  const data: MovieChartResponse = await response.json();

  return data.items
    .filter((movie) => movie.rank <= 3)
    .sort((a, b) => a.rank - b.rank);
}
