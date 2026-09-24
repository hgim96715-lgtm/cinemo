import { ApiProperty } from '@nestjs/swagger';

export class UserMovieCalendarItemDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ example: '2026-09-03', format: 'date' })
  date!: string;

  @ApiProperty({ example: '이웃집 토토로' })
  title!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/poster.jpg',
  })
  posterPath!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  watchedAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  viewingPlace!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  rating!: number | null;

  @ApiProperty({ type: String, nullable: true })
  review!: string | null;
}
