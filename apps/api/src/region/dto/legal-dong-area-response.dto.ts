import { ApiProperty } from '@nestjs/swagger';

export class LegalDongAreaResponseDto {
  @ApiProperty({ example: '1100000000', description: '10자리 법정동 코드' })
  regionCode!: string;

  @ApiProperty({ example: '11', description: '시도 코드' })
  sidoCode!: string;

  @ApiProperty({ example: '110', description: '시군구 코드' })
  sigunguCode!: string;

  @ApiProperty({ example: '청운동', description: '최하위 지역명' })
  lowestName!: string;

  @ApiProperty({
    example: '서울특별시 종로구 청운동',
    description: '법정동 전체 주소명',
  })
  addressName!: string;
}
