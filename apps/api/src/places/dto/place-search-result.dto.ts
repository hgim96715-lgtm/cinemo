import { ApiProperty } from '@nestjs/swagger';

export class PlaceSearchResultDto {
  @ApiProperty({ example: '123456789' })
  id!: string;

  @ApiProperty({ example: 'CGV 압구정' })
  name!: string;

  @ApiProperty({ example: '영화관' })
  category!: string;

  @ApiProperty({ example: '서울 강남구 압구정동 123' })
  address!: string;

  @ApiProperty({ example: '서울 강남구 논현로 123' })
  roadAddress!: string;

  @ApiProperty({ example: 'https://place.map.kakao.com/123456789' })
  placeUrl!: string;

  @ApiProperty({ example: 127.0286 })
  longitude!: number;

  @ApiProperty({ example: 37.5263 })
  latitude!: number;
}
