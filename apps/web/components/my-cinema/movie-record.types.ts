import type { MovieSearchItem } from '@cinemo/api-contract';

export type WatchedRecordMovie = Pick<
  MovieSearchItem,
  'id' | 'title' | 'poster_path'
>;
