import { ApiProperty } from '@nestjs/swagger';
import { USER_MOVIE_KINDS, type UserMovieKind } from '@cinemo/shared';

export class UserMovieDisplayResponseDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ enum: USER_MOVIE_KINDS, example: 'watched' })
  kind!: UserMovieKind;

  @ApiProperty({ example: true })
  isDisplayed!: boolean;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  wallSlot!: number | null;
}
