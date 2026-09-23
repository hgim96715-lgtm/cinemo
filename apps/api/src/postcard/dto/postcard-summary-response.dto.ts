import { ApiProperty } from '@nestjs/swagger';

export class PostcardSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ example: 'cinemo_user' })
  nickname!: string;

  @ApiProperty({ type: String, nullable: true, example: '파이트 클럽' })
  movieTitle!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'What we do repeatedly is what we are.',
  })
  originalText!: string | null;

  @ApiProperty({ example: '우리가 반복해서 하는 일이 곧 우리다.' })
  text!: string;

  @ApiProperty({ type: String, nullable: true, example: '/poster-path.jpg' })
  posterPath!: string | null;

  @ApiProperty({ example: true })
  isPublic!: boolean;

  @ApiProperty({ example: false })
  isPinned!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
