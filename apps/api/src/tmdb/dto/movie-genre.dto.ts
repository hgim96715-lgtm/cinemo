import { ApiProperty } from '@nestjs/swagger';

export class MovieGenreDto {
  @ApiProperty({ example: 18 })
  id!: number;

  @ApiProperty({ example: '드라마' })
  name!: string;
}

export class MovieGenresResponseDto {
  @ApiProperty({ type: [MovieGenreDto] })
  genres!: MovieGenreDto[];
}
