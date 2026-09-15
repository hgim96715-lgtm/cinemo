export function MovieChartHistorySkeleton() {
  return (
    <section
      className="movie-chart-stats movie-chart-stats-skeleton"
      aria-label="이번 달 차트 흐름을 불러오는 중"
      aria-busy="true"
    >
      <h2>이번 달 차트 흐름</h2>
      <div className="movie-chart-stats-chart">
        <div className="movie-chart-chart-skeleton" />
      </div>
    </section>
  );
}
