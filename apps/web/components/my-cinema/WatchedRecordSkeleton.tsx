type WatchedRecordSkeletonProps = {
  count?: number;
};

export function WatchedRecordSkeleton({
  count = 9,
}: WatchedRecordSkeletonProps) {
  return (
    <ul
      className="my-cinema-movie-grid my-cinema-movie-grid--watched my-cinema-skeleton-grid watched-record-skeleton-grid"
      aria-busy="true"
      aria-label="관람 기록을 불러오는 중"
    >
      {Array.from({ length: count }, (_, index) => (
        <li className="my-cinema-movie my-cinema-movie--watched" key={index}>
          <article className="my-cinema-movie-card-wrap my-cinema-skeleton-card watched-record-skeleton-card">
            <div className="my-cinema-movie-poster my-cinema-skeleton-poster watched-record-skeleton-poster" />

            <div className="my-cinema-movie-info">
              <div className="my-cinema-movie-meta">
                <span className="my-cinema-watched-kicker my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-kicker" />
                <span className="my-cinema-movie-title my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-title" />

                <div className="my-cinema-watched-details">
                  <div className="my-cinema-watched-meta">
                    <span className="my-cinema-watched-date">
                      <small className="my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-label" />
                      <strong className="my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-value" />
                    </span>
                    <span className="my-cinema-watched-location">
                      <small className="my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-label" />
                      <strong className="my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-value watched-record-skeleton-value--short" />
                    </span>
                  </div>

                  <span className="my-cinema-watched-rating my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-rating" />
                  <p className="my-cinema-watched-review my-cinema-skeleton-line watched-record-skeleton-line watched-record-skeleton-review" />
                </div>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
