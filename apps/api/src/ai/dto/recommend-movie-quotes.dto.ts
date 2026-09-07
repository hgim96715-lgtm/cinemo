import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecommendMovieQuotesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsInt()
  releaseYear!: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  overview!: string | null;
}
