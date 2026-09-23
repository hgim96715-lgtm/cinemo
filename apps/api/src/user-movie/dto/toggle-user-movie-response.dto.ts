import { ApiProperty } from '@nestjs/swagger';
import { USER_MOVIE_KINDS, type UserMovieKind } from '@cinemo/shared';

export class ToggleUserMovieResponseDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ enum: USER_MOVIE_KINDS, example: 'wish' })
  kind!: UserMovieKind;

  @ApiProperty({ example: true })
  active!: boolean;
}
