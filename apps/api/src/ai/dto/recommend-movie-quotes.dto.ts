import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendMovieQuotesDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId!: number;

  @ApiProperty({ example: '파이트 클럽' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Fight Club' })
  @IsString()
  @MaxLength(200)
  originalTitle!: string | null;

  @IsOptional()
  @ApiPropertyOptional({ type: String, nullable: true, example: 'en' })
  @IsString()
  @MaxLength(16)
  originalLanguage!: string | null;

  @IsOptional()
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1999 })
  @IsInt()
  releaseYear!: number | null;

  @IsOptional()
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @MaxLength(5000)
  overview!: string | null;
}
