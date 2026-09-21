// apps/api/src/cinema/dto/cinema-analysis-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CinemaAnalysisItemDto {
  @ApiProperty({ example: '서울특별시' })
  name: string;

  @ApiProperty({ example: 51 })
  count: number;
}

export class CinemaAnalysisResponseDto {
  @ApiProperty({ example: 250 })
  totalCount: number;

  @ApiProperty({ type: [CinemaAnalysisItemDto] })
  regions: CinemaAnalysisItemDto[];

  @ApiProperty({ type: [CinemaAnalysisItemDto] })
  brands: CinemaAnalysisItemDto[];
}
