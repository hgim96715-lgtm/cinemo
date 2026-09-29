import { ApiProperty } from '@nestjs/swagger';

export class UpcomingMovieDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 123456,
  })
  tmdbId!: number | null;

  @ApiProperty({ example: '어벤져스: 엔드게임 앙코르' })
  title!: string;

  @ApiProperty({
    example: '2026-09-23',
    format: 'date',
  })
  releaseDate!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'http://file.koreafilm.or.kr/poster.jpg',
  })
  posterPath!: string | null;

  @ApiProperty({ example: 12 })
  interestCount!: number;

  @ApiProperty({
    example: true,
    description: 'KOBIS에서 국내 개봉일이 확인된 영화인지 여부',
  })
  isReleaseDateConfirmed!: boolean;

  @ApiProperty({
    type: [String],
    example: ['액션', 'SF'],
  })
  genres!: string[];
}

export class UpcomingMoviesResponseDto {
  @ApiProperty({ type: [UpcomingMovieDto] })
  items!: UpcomingMovieDto[];

  @ApiProperty({ example: 24 })
  total!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}
