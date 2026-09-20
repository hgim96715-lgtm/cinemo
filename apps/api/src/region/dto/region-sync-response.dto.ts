import { ApiProperty } from '@nestjs/swagger';

export class RegionSyncResponseDto {
  @ApiProperty({
    example: 17,
    description: '동기화된 광역지역 수',
  })
  regionsCount!: number;

  @ApiProperty({
    example: 250,
    description: '동기화된 구·군 수',
  })
  districtsCount!: number;
}
