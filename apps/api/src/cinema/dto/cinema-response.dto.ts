import { ApiProperty } from '@nestjs/swagger';

export class CinemaResponseDto {
  @ApiProperty({ description: '영화관 DB ID' })
  id!: string;

  @ApiProperty({ description: '카카오 장소 ID' })
  kakaoId!: string;

  @ApiProperty({
    type: String,
    description: '영화관 브랜드',
    example: 'CGV',
    nullable: true,
  })
  brand!: string | null;

  @ApiProperty({ description: '영화관 이름' })
  name!: string;

  @ApiProperty({
    type: String,
    description: '카카오 장소 카테고리',
    nullable: true,
  })
  category!: string | null;

  @ApiProperty({ description: '지번 주소' })
  address!: string;

  @ApiProperty({
    type: String,
    description: '도로명 주소',
    nullable: true,
  })
  roadAddress!: string | null;

  @ApiProperty({
    type: String,
    description: '카카오맵 장소 URL',
    nullable: true,
  })
  placeUrl!: string | null;

  @ApiProperty({ description: '위도' })
  latitude!: number;

  @ApiProperty({ description: '경도' })
  longitude!: number;

  @ApiProperty({ description: 'Region ID' })
  regionId!: string;

  @ApiProperty({
    type: String,
    description: 'District ID',
    nullable: true,
  })
  districtId!: string | null;
}
