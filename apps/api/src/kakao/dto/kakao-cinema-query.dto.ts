import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class KakaoCinemaQueryDto {
  @ApiProperty({
    description: '영화관을 검색할 지역명',
    example: '서울특별시',
  })
  @IsString()
  @IsNotEmpty()
  region: string;
}
