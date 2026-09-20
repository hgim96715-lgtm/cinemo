import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LegalDongRowDto {
  @ApiProperty({ example: '2717010900', description: '10자리 법정동 코드' })
  region_cd!: string;

  @ApiProperty({ example: '27', description: '시도 코드' })
  sido_cd!: string;

  @ApiProperty({ example: '170', description: '시군구 코드' })
  sgg_cd!: string;

  @ApiProperty({ example: '109', description: '읍면동 코드' })
  umd_cd!: string;

  @ApiProperty({ example: '00', description: '리 코드' })
  ri_cd!: string;

  @ApiProperty({ example: '2717010900', description: '법정동 주민 코드' })
  locatjumin_cd!: string;

  @ApiProperty({ example: '2717010900', description: '법정동 지적 코드' })
  locatjijuk_cd!: string;

  @ApiProperty({
    example: '대구광역시 서구 원대동3가',
    description: '지역 주소명',
  })
  locatadd_nm!: string;

  @ApiProperty({ example: 9, description: '지역 정렬 순서' })
  locat_order!: number;

  @ApiPropertyOptional({ example: '', description: '지역 비고' })
  locat_rm?: string;

  @ApiProperty({ example: '2717000000', description: '상위 지역 코드' })
  locathigh_cd!: string;

  @ApiProperty({ example: '원대동3가', description: '최하위 지역명' })
  locallow_nm!: string;

  @ApiProperty({ example: '', description: '법정동 적용일자(YYYYMMDD)' })
  adpt_de!: string;
}
