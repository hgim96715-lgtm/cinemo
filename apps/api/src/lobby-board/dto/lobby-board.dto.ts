import { ApiProperty } from '@nestjs/swagger';

export class BoardBoxOfficeMovieDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: '오디세이' })
  title!: string;

  @ApiProperty({ example: 10333000 })
  audienceCount!: number;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  rankChange!: number | null;

  @ApiProperty({ type: String, nullable: true, example: '/poster-path.jpg' })
  posterPath!: string | null;
}

export class BoardUpcomingInterestMovieDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 123456 })
  tmdbId!: number;

  @ApiProperty({ example: '오디세이' })
  title!: string;

  @ApiProperty({ example: '2026-09-25', format: 'date' })
  releaseDate!: string;

  @ApiProperty({ example: 12 })
  interestCount!: number;

  @ApiProperty({ type: String, nullable: true, example: '/poster-path.jpg' })
  posterPath!: string | null;
}

export class LobbyBoardResponseDto {
  @ApiProperty({ type: [BoardBoxOfficeMovieDto] })
  boxOfficeMovies!: BoardBoxOfficeMovieDto[];

  @ApiProperty({ type: [BoardUpcomingInterestMovieDto] })
  upcomingInterestMovies!: BoardUpcomingInterestMovieDto[];
}

export class LobbyVisitResponseDto {
  @ApiProperty({ example: true })
  ok!: true;
}
