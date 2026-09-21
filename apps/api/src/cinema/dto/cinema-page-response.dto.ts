// apps/api/src/cinema/dto/cinema-page-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { CinemaResponseDto } from './cinema-response.dto';

export class CinemaPageResponseDto {
  @ApiProperty({
    type: [CinemaResponseDto],
    description: '현재 페이지의 영화관 목록',
  })
  items!: CinemaResponseDto[];

  @ApiProperty({
    example: 140,
    description: '전체 영화관 수',
  })
  totalCount!: number;

  @ApiProperty({
    example: 1,
    description: '현재 페이지 번호',
  })
  page!: number;

  @ApiProperty({
    example: 20,
    description: '페이지당 영화관 수',
  })
  pageSize!: number;

  @ApiProperty({
    example: 7,
    description: '전체 페이지 수',
  })
  totalPages!: number;
}
