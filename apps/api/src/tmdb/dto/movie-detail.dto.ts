import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovieSummaryDto } from './movie-summary.dto';

export class MovieDetailDto extends MovieSummaryDto {
  @ApiProperty({ type: [Number], example: [18, 53] })
  genre_ids!: number[];

  @ApiProperty({ type: [String], example: ['US'] })
  origin_countries!: string[];

  @ApiPropertyOptional({ type: String, nullable: true, example: '1999-10-15' })
  firstReleaseDate?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['2026-09-16'] })
  reReleaseDates?: string[];
}
