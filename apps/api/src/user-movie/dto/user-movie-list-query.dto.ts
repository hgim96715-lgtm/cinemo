import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { UserMovieKind } from '../../generated/prisma/enums';
import { Type } from 'class-transformer';

export class UserMovieListQueryDto {
  @ApiProperty({
    enum: UserMovieKind,
    example: UserMovieKind.watched,
  })
  @IsEnum(UserMovieKind)
  kind!: UserMovieKind;

  @ApiPropertyOptional({ default: 9, minimum: 1, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  take = 9;

  @ApiPropertyOptional({
    description: '다음 페이지 조회에 사용할 마지막 UserMovie id',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
