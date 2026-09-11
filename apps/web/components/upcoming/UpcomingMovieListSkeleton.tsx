type UpcomingMovieListSkeletonProps = {
  count?: number;
};

export function UpcomingMovieListSkeleton({
  count = 6,
}: UpcomingMovieListSkeletonProps) {
  return (
    <div
      className="upcoming-skeleton-list"
      aria-busy="true"
      aria-label="개봉 예정작을 불러오는 중"
    >
      {Array.from({ length: count }, (_, index) => (
        <article
          className="upcoming-movie-card upcoming-skeleton-card"
          key={index}
          aria-hidden="true"
        >
          <span className="upcoming-skeleton-block upcoming-skeleton-poster" />

          <div className="upcoming-skeleton-copy">
            <span className="upcoming-skeleton-block upcoming-skeleton-title" />
            <span className="upcoming-skeleton-block upcoming-skeleton-date" />
            <span className="upcoming-skeleton-block upcoming-skeleton-count" />
          </div>

          <div className="upcoming-skeleton-actions">
            <span className="upcoming-skeleton-block upcoming-skeleton-button" />
            <span className="upcoming-skeleton-block upcoming-skeleton-button upcoming-skeleton-button--short" />
          </div>
        </article>
      ))}
    </div>
  );
}
