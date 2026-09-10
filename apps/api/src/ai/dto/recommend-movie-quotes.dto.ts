import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecommendMovieQuotesDto {
  @IsInt()
  @Min(1)
  tmdbId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  originalTitle!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  originalLanguage!: string | null;

  @IsOptional()
  @IsInt()
  releaseYear!: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  overview!: string | null;
}
