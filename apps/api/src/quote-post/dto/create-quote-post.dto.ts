import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuotePostDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  tmdbId: number;

  @ApiProperty({ example: '내일은 내일의 태양이 뜬다.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  usePosterBackground?: boolean;
}
