import { ApiProperty } from '@nestjs/swagger';
import { MovieSummaryDto } from '../../tmdb/dto/movie-summary.dto';

export class DisplayedUserMovieDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ example: 1 })
  wallSlot!: number;

  @ApiProperty({ type: MovieSummaryDto })
  movie!: MovieSummaryDto;
}

export class UserMovieDisplayedResponseDto {
  @ApiProperty({ type: [DisplayedUserMovieDto] })
  items!: DisplayedUserMovieDto[];
}
