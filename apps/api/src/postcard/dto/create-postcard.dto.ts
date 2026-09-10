import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePostcardDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId: number;

  @ApiPropertyOptional({
    example: '파이트 클럽',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  movieTitle?: string | null;

  @ApiProperty({
    example: '우리가 반복해서 하는 일이 곧 우리다.',
  })
  @IsString()
  @MaxLength(1000)
  text: string;

  @ApiPropertyOptional({
    example: 'What we do repeatedly is what we are.',
    nullable: true,
    description: '엽서 문구의 외국어 원문',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  originalText?: string | null;

  @ApiPropertyOptional({
    example: '/poster-path.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  posterPath?: string | null;

  @ApiPropertyOptional({
    default: true,
    description: '공개 엽서 여부',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
