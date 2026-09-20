import { ApiProperty } from '@nestjs/swagger';

export class DistrictResponseDto {
  @ApiProperty({
    example: 'uuid',
    description: '구·군 식별자',
  })
  id!: string;

  @ApiProperty({
    example: '강남구',
    description: '구·군 이름',
  })
  name!: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 37.5172,
    description: '구·군 중심 위도',
  })
  centerLatitude!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 127.0473,
    description: '구·군 중심 경도',
  })
  centerLongitude!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 13,
    description: '구·군 지도 확대 단계',
  })
  zoom!: number | null;

  @ApiProperty({
    example: '서울특별시 중구',
    description: '구·군 전체 주소명',
  })
  addressName!: string;
}
