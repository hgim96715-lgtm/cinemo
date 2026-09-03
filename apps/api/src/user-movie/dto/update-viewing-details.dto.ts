import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserMovieViewingType } from '../../generated/prisma/enums';

export class UpdateViewingDetailsDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId: number;

  @ApiPropertyOptional({
    example: '2026-09-02',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  watchedAt?: string | null;

  @ApiPropertyOptional({
    enum: UserMovieViewingType,
    nullable: true,
    example: UserMovieViewingType.home,
  })
  @IsOptional()
  @IsEnum(UserMovieViewingType)
  viewingType?: UserMovieViewingType | null;

  @ApiPropertyOptional({ nullable: true, example: '친구 집' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  viewingTypeCustom?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Netflix' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  viewingPlatform?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '집' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  viewingLocation?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '영상미가 인상 깊었던 영화',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    minimum: 1,
    maximum: 10,
    example: 8,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;
}
