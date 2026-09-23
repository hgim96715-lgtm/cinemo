import { ApiProperty } from '@nestjs/swagger';
import {
  USER_MOVIE_VIEWING_TYPES,
  type UserMovieViewingType,
} from '@cinemo/shared';
import { MovieSummaryDto } from '../../tmdb/dto/movie-summary.dto';

export class UserMovieListItemDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  watchedAt!: string | null;

  @ApiProperty({ enum: USER_MOVIE_VIEWING_TYPES, nullable: true })
  viewingType!: UserMovieViewingType | null;

  @ApiProperty({ type: String, nullable: true })
  viewingTypeCustom!: string | null;

  @ApiProperty({ type: String, nullable: true })
  viewingPlatform!: string | null;

  @ApiProperty({ type: String, nullable: true })
  viewingPlace!: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  cinemaId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  review!: string | null;

  @ApiProperty({ type: Number, nullable: true, minimum: 1, maximum: 10 })
  rating!: number | null;

  @ApiProperty({ type: MovieSummaryDto })
  movie!: MovieSummaryDto;
}

export class UserMovieListResponseDto {
  @ApiProperty({ type: [UserMovieListItemDto] })
  items!: UserMovieListItemDto[];

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  nextCursor!: string | null;
}
