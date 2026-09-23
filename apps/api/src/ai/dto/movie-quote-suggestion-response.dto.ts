import { ApiProperty } from '@nestjs/swagger';

export class MovieQuoteSuggestionResponseDto {
  @ApiProperty({ example: 'May the Force be with you.' })
  originalText!: string;

  @ApiProperty({ example: '포스가 함께하기를.' })
  koreanText!: string;

  @ApiProperty({ example: 'en' })
  originalLanguage!: string;

  @ApiProperty({ example: true })
  isPopular!: boolean;

  @ApiProperty({ type: String, nullable: true, example: 'Star Wars' })
  source!: string | null;
}
