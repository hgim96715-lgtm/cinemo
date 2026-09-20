import { ApiProperty } from '@nestjs/swagger';

export class KakaoPlaceDocumentDto {
  @ApiProperty({
    description: '카카오 장소 고유 ID',
    example: '123456789',
  })
  id: string;

  @ApiProperty({
    description: '장소명',
    example: 'CGV 강남',
  })
  place_name: string;

  @ApiProperty({
    description: '카카오 장소 카테고리 전체 경로',
    example: '문화,예술 > 영화관',
  })
  category_name: string;

  @ApiProperty({
    description: '지번 주소',
    example: '서울 강남구 역삼동 123',
  })
  address_name: string;

  @ApiProperty({
    description: '도로명 주소',
    example: '서울 강남구 강남대로 438',
  })
  road_address_name: string;

  @ApiProperty({
    description: '카카오맵 장소 상세 페이지 URL',
    example: 'https://place.map.kakao.com/123456789',
  })
  place_url: string;

  @ApiProperty({
    description: '경도',
    example: '127.0276',
  })
  x: string;

  @ApiProperty({
    description: '위도',
    example: '37.4979',
  })
  y: string;
}
