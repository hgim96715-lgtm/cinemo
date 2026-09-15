import { ApiProperty } from '@nestjs/swagger';

export class MovieChartHistoryItemDto {
  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  chartDate!: string;

  @ApiProperty({ example: '20251234' })
  kobisMovieCd!: string;

  @ApiProperty({ type: Number, nullable: true, example: 123456 })
  tmdbId!: number | null;

  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: '오디세이' })
  title!: string;

  @ApiProperty({ example: 65000 })
  dailyAudienceCount!: number;

  @ApiProperty({ example: 10333000 })
  audienceCount!: number;
}
