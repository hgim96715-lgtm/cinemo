import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CinemaQueryDto {
  @ApiProperty({
    description: '조회할 Region 이름',
    example: '서울특별시',
  })
  @IsString()
  @IsNotEmpty()
  region!: string;
}
