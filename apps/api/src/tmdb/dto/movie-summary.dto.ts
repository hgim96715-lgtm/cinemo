import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MovieSummaryDto {
  @ApiProperty({ example: 550 })
  id!: number;

  @ApiProperty({ example: '파이트 클럽' })
  title!: string;

  @ApiPropertyOptional({ example: 'Fight Club' })
  original_title?: string;

  @ApiPropertyOptional({ example: 'en' })
  original_language?: string;

  @ApiProperty({ example: '한 남자가 반복되는 일상에서 벗어나기 위해...' })
  overview!: string;

  @ApiProperty({ type: String, nullable: true, example: '/poster.jpg' })
  poster_path!: string | null;

  @ApiProperty({ example: '1999-10-15' })
  release_date!: string;

  @ApiProperty({ type: String, nullable: true, example: '데이비드 핀처' })
  director!: string | null;

  @ApiPropertyOptional({ type: [String], example: ['브래드 피트'] })
  cast?: string[];

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://www.youtube.com/watch?v=example',
  })
  trailerUrl?: string | null;

  @ApiPropertyOptional({ enum: ['trailer'], nullable: true })
  videoType?: 'trailer' | null;
}
