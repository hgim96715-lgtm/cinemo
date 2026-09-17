import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MovieChartItemDto {
  @ApiProperty({ example: '20251234' })
  kobisMovieCd!: string;

  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: '오디세이' })
  title!: string;

  @ApiProperty({ example: 65000 })
  dailyAudienceCount!: number;

  @ApiProperty({ example: 10333000 })
  audienceCount!: number;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  rankChange!: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/poster-path.jpg',
  })
  posterPath!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://www.youtube.com/watch?v=example',
  })
  trailerUrl!: string | null;

  @ApiProperty({
    enum: ['trailer'],
    nullable: true,
    example: 'trailer',
  })
  videoType!: 'trailer' | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-09-16',
  })
  releaseDate!: string | null;

  @ApiProperty({
    type: [String],
    example: ['2026-09-16'],
    description: 'TMDB에서 확인된 재개봉일 목록',
  })
  reReleaseDates!: string[];

  @ApiProperty({ type: Number, nullable: true, example: 550 })
  tmdbId!: number | null;
}

export class MovieChartResponseDto {
  @ApiProperty({ type: [MovieChartItemDto] })
  items!: MovieChartItemDto[];

  @ApiProperty({
    example: '2026-09-13',
    description: 'KOBIS 박스오피스 기준일',
  })
  targetDate!: string;

  @ApiProperty({ example: 10 })
  total!: number;
}
