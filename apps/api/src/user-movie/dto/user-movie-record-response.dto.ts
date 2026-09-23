import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  USER_MOVIE_KINDS,
  USER_MOVIE_VIEWING_TYPES,
  type UserMovieKind,
  type UserMovieViewingType,
} from '@cinemo/shared';

export class UserMovieRecordResponseDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ enum: USER_MOVIE_KINDS, example: 'watched' })
  kind!: UserMovieKind;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  watchedAt!: string | null;

  @ApiPropertyOptional({ enum: USER_MOVIE_VIEWING_TYPES, nullable: true })
  viewingType!: UserMovieViewingType | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  viewingTypeCustom!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  viewingPlatform!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  viewingPlace!: string | null;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  cinemaId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  review!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 1, maximum: 10 })
  rating!: number | null;
}
