import { ApiProperty } from '@nestjs/swagger';
import { MovieSummaryDto } from './movie-summary.dto';

export class MovieDetailDto extends MovieSummaryDto {
  @ApiProperty({ type: [String], example: ['US'] })
  origin_countries!: string[];
}
