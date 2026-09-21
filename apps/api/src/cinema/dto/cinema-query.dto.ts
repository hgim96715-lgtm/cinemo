import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CinemaQueryDto {
  @ApiPropertyOptional({
    description: '지역명. 없으면 전체 지역을 조회함',
    example: '서울특별시',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  region?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: '페이지당 영화관 수',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;
}
