import { ApiProperty } from '@nestjs/swagger';

export class UpcomingMovieDto {
  @ApiProperty({ example: 123456 })
  tmdbId!: number;

  @ApiProperty({ example: '오디세이' })
  title!: string;

  @ApiProperty({ example: '2026-09-25', format: 'date' })
  releaseDate!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/poster-path.jpg',
  })
  posterPath!: string | null;

  @ApiProperty({ example: 12 })
  interestCount!: number;

  @ApiProperty({
    example: true,
    description: 'KOBIS에서 국내 개봉일이 확인된 영화인지 여부',
  })
  isReleaseDateConfirmed!: boolean;
}

export class UpcomingMoviesResponseDto {
  @ApiProperty({ type: [UpcomingMovieDto] })
  items!: UpcomingMovieDto[];

  @ApiProperty({ example: 24 })
  total!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}
