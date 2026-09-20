import { ApiProperty } from '@nestjs/swagger';

export class KakaoPlaceMetaDto {
  @ApiProperty({
    description: '마지막 페이지인지 여부',
    example: true,
  })
  is_end: boolean;

  @ApiProperty({
    description: '현재 검색 조건에서 조회 가능한 전체 페이지 수',
    example: 3,
  })
  pageable_count: number;

  @ApiProperty({
    description: '검색 결과 전체 개수',
    example: 12,
  })
  total_count: number;
}
