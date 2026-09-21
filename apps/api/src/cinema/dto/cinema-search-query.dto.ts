import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CinemaSearchQueryDto {
  @ApiProperty({
    description: '전국 영화관 검색어',
    example: '메가박스 이수',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query!: string;
}
