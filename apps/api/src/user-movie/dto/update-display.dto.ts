import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, Max, Min } from 'class-validator';
import { USER_MOVIE_KINDS, type UserMovieKind } from '@cinemo/shared';

export class UpdateDisplayDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId: number;

  @ApiProperty({ enum: USER_MOVIE_KINDS, example: 'watched' })
  @IsIn([...USER_MOVIE_KINDS])
  kind: UserMovieKind;

  @ApiProperty({ example: true })
  @IsBoolean()
  isDisplayed: boolean;

  @ApiProperty({ example: 1, description: '포스터 위치 순서 1~3' })
  @IsInt()
  @Min(1)
  @Max(3)
  wallSlot: number;
}
