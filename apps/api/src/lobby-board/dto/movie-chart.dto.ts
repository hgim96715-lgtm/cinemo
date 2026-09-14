import { ApiProperty } from '@nestjs/swagger';

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
    enum: ['trailer', 'teaser'],
    nullable: true,
    example: 'trailer',
  })
  videoType!: 'trailer' | 'teaser' | null;
}

export class MovieChartResponseDto {
  @ApiProperty({ type: [MovieChartItemDto] })
  items!: MovieChartItemDto[];

  @ApiProperty({ example: 10 })
  total!: number;
}
