import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  USER_MOVIE_VIEWING_TYPES,
  type UserMovieViewingType,
} from '@cinemo/shared';

export class UpdateViewingDetailsDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId: number;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    format: 'uuid',
    example: '0198f4c4-7f2d-7b1d-a8f7-3d8e1d1c2a10',
  })
  @IsOptional()
  @IsUUID()
  cinemaId?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-09-02',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  watchedAt?: string | null;

  @ApiPropertyOptional({
    enum: USER_MOVIE_VIEWING_TYPES,
    nullable: true,
    example: 'home',
  })
  @IsOptional()
  @IsIn([...USER_MOVIE_VIEWING_TYPES])
  viewingType?: UserMovieViewingType | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '친구 집' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  viewingTypeCustom?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Netflix' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  viewingPlatform?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '집' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  viewingPlace?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '영상미가 인상 깊었던 영화',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review?: string | null;

  @ApiPropertyOptional({
    type: Number,
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
