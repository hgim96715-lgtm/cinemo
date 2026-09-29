import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class MoviePoolBackfillDto {
  @ApiPropertyOptional({
    example: 5,
    default: 5,
    minimum: 1,
    maximum: 10,
    description: 'TMDB discover 페이지 수',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  pages = 5;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: '기존 movie_pool 데이터도 다시 조회할지 여부',
  })
  @IsOptional()
  @IsBoolean()
  force = false;
}
