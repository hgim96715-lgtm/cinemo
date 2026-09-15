import * as Dialog from '@radix-ui/react-dialog';
import { MovieVideoModal } from '@/components/common/MovieVideoModal';
import type { MovieChartItem } from '@cinemo/api-contract';

type MovieChartTrailerModalProps = {
  movie: MovieChartItem;
  onClose: () => void;
};

export function MovieChartTrailerModal({
  movie,
  onClose,
}: MovieChartTrailerModalProps) {
  if (!movie.trailerUrl) {
    return null;
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <MovieVideoModal
        title={movie.title}
        videoUrl={movie.trailerUrl}
        videoType={movie.videoType}
      />
    </Dialog.Root>
  );
}
