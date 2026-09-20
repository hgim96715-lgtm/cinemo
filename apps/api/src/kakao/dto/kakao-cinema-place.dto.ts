import { ApiProperty } from '@nestjs/swagger';

export class KakaoCinemaPlaceDto {
  @ApiProperty({
    description: '카카오 장소 고유 ID',
    example: '123456789',
  })
  kakaoId: string;

  @ApiProperty({
    description: '영화관 이름',
    example: 'CGV 강남',
  })
  name: string;

  @ApiProperty({
    description: '카카오 장소 카테고리',
    example: '문화,예술 > 영화관',
  })
  category: string;

  @ApiProperty({
    description: '지번 주소',
    example: '서울 강남구 역삼동 123',
  })
  address: string;

  @ApiProperty({
    description: '도로명 주소',
    example: '서울 강남구 강남대로 438',
    nullable: true,
  })
  roadAddress: string | null;

  @ApiProperty({
    description: '카카오맵 장소 상세 페이지 URL',
    example: 'https://place.map.kakao.com/123456789',
    nullable: true,
  })
  placeUrl: string | null;

  @ApiProperty({
    description: '경도',
    example: 127.0276,
  })
  longitude: number;

  @ApiProperty({
    description: '위도',
    example: 37.4979,
  })
  latitude: number;
}
