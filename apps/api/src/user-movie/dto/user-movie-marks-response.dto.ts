import { ApiProperty } from '@nestjs/swagger';

export class UserMovieMarksResponseDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ example: true })
  wish!: boolean;

  @ApiProperty({ example: false })
  watched!: boolean;
}
