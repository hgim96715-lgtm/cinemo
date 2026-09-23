import { PickType } from '@nestjs/swagger';
import { MovieDetailDto } from '../../tmdb/dto/movie-detail.dto';

export class WishMovieDetailResponseDto extends PickType(MovieDetailDto, [
  'genre_ids',
  'firstReleaseDate',
  'reReleaseDates',
] as const) {}
