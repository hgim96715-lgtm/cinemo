export function LobbyBoardSkeleton() {
  return (
    <div className="lobby-board-skeleton" aria-hidden="true">
      <div className="lobby-board-skeleton-list">
        {[1, 2, 3].map((rank) => (
          <div className="lobby-board-skeleton-row" key={rank}>
            <div className="lobby-board-skeleton-row-header">
              <span className="lobby-board-skeleton-rank" />
              <span className="lobby-board-skeleton-change" />
            </div>

            <div className="lobby-board-skeleton-row-content">
              <span className="lobby-board-skeleton-poster" />
              <span className="lobby-board-skeleton-info">
                <span className="lobby-board-skeleton-title" />
                <span className="lobby-board-skeleton-count" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
