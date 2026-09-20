import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class LegalDongQueryDto {
  @ApiPropertyOptional({
    example: '27',
    description: '시도 코드',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  sidoCode?: string;

  @ApiPropertyOptional({
    example: 100,
    default: 100,
    maximum: 500,
    description: '조회할 최대 개수',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 100;
}
