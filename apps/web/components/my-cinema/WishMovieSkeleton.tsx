type WishMovieSkeletonProps = {
  count?: number;
};

export function WishMovieSkeleton({
  count = 6,
}: WishMovieSkeletonProps) {
  return (
    <ul
      className="my-cinema-movie-grid my-cinema-movie-grid--wish my-cinema-skeleton-grid wish-movie-skeleton-grid"
      aria-busy="true"
      aria-label="보고 싶은 영화를 불러오는 중"
    >
      {Array.from({ length: count }, (_, index) => (
        <li className="my-cinema-movie" key={index}>
          <article className="my-cinema-movie-card-wrap my-cinema-skeleton-card wish-movie-skeleton-card">
            <div className="my-cinema-movie-poster my-cinema-skeleton-poster wish-movie-skeleton-poster" />

            <div className="my-cinema-movie-info">
              <div className="my-cinema-wish-info">
                <div className="my-cinema-wish-title-row">
                  <span className="my-cinema-skeleton-line wish-movie-skeleton-line wish-movie-skeleton-title" />
                  <span className="my-cinema-skeleton-heart wish-movie-skeleton-heart" aria-hidden="true" />
                </div>

                <span className="my-cinema-skeleton-line wish-movie-skeleton-line wish-movie-skeleton-facts" />
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
