export function MovieChartListSkeleton() {
  return (
    <div
      className="movie-chart-list-skeleton"
      role="status"
      aria-label="영화 차트를 불러오는 중"
    >
      <div className="movie-chart-tabs movie-chart-tabs--skeleton" aria-hidden="true">
        <span className="movie-chart-tab movie-chart-tab--skeleton movie-chart-tab--active">
          현재 순위
        </span>
        <span className="movie-chart-tab movie-chart-tab--skeleton">
          순위 흐름
        </span>
      </div>

      <ol className="movie-chart-list" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <li
            className="movie-chart-item movie-chart-item--skeleton"
            key={index}
          >
            <span className="movie-chart-skeleton movie-chart-skeleton-rank" />
            <span className="movie-chart-skeleton movie-chart-skeleton-poster" />

            <div className="movie-chart-info">
              <span className="movie-chart-skeleton movie-chart-skeleton-title" />

              <div className="movie-chart-audience">
                <span className="movie-chart-skeleton movie-chart-skeleton-stat" />
                <span className="movie-chart-skeleton movie-chart-skeleton-stat" />
              </div>

              <span className="movie-chart-skeleton movie-chart-skeleton-change" />
              <span className="movie-chart-skeleton movie-chart-skeleton-button" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
