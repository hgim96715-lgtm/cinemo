import { ApiProperty } from '@nestjs/swagger';
import { DistrictResponseDto } from './district-response.dto';

export class RegionResponseDto {
  @ApiProperty({
    example: 'uuid',
    description: '광역지역 식별자',
  })
  id!: string;

  @ApiProperty({
    example: '서울특별시',
    description: '광역지역 이름',
  })
  name!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 37.5665,
    description: '광역지역 중심 위도',
  })
  centerLatitude!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 126.978,
    description: '광역지역 중심 경도',
  })
  centerLongitude!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 11,
    description: '광역지역 지도 확대 단계',
  })
  zoom!: number | null;

  @ApiProperty({
    type: [DistrictResponseDto],
    description: '해당 광역지역에 속한 구·군 목록',
  })
  districts!: DistrictResponseDto[];

  @ApiProperty({
    example: '서울특별시',
    description: '광역지역 전체 주소명',
  })
  addressName!: string;
}
