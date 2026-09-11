type PostcardListSkeletonProps = {
  count?: number;
};

export function PostcardListSkeleton({ count = 2 }: PostcardListSkeletonProps) {
  return (
    <section
      className="postcard-grid postcard-skeleton-grid"
      aria-busy="true"
      aria-label="엽서를 불러오는 중"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="postcard-card-group" key={index}>
          <article className="postcard-card postcard-skeleton-card">
            <div className="postcard-card-poster postcard-skeleton-poster" />

            <div className="postcard-card-content">
              <span className="postcard-skeleton-line postcard-skeleton-movie" />
              <span className="postcard-skeleton-line postcard-skeleton-title" />
              <span className="postcard-skeleton-line postcard-skeleton-text" />
              <span className="postcard-skeleton-line postcard-skeleton-text short" />

              <div className="postcard-skeleton-meta">
                <span className="postcard-skeleton-line" />
                <span className="postcard-skeleton-line" />
              </div>

              <div className="postcard-skeleton-reactions">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </article>
        </div>
      ))}
    </section>
  );
}
