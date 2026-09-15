import { ApiProperty } from '@nestjs/swagger';

export class MovieChartStatsItemDto {
  @ApiProperty({ example: '20251234' })
  kobisMovieCd!: string;

  @ApiProperty({ example: '오디세이' })
  title!: string;

  @ApiProperty({ example: 10333000 })
  audienceCount!: number;

  @ApiProperty({ example: 125000 })
  audienceChange!: number;

  @ApiProperty({ example: 850000 })
  dailyAudienceTotal!: number;

  @ApiProperty({ example: 1 })
  bestRank!: number;

  @ApiProperty({ example: 2 })
  lastRank!: number;

  @ApiProperty({
    example: 1,
    description: '양수이면 순위 상승, 음수이면 순위 하락',
  })
  rankChange!: number;

  @ApiProperty({ example: 14 })
  rankSampleCount!: number;
}

export class MovieChartStatsResponseDto {
  @ApiProperty({ example: '2026-09-01' })
  from!: string;

  @ApiProperty({ example: '2026-09-14' })
  to!: string;

  @ApiProperty({ type: [MovieChartStatsItemDto] })
  items!: MovieChartStatsItemDto[];
}
