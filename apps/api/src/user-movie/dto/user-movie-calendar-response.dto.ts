import { ApiProperty } from '@nestjs/swagger';
import { UserMovieCalendarItemDto } from './user-movie-calendar-item.dto';

export class UserMovieCalendarResponseDto {
  @ApiProperty({ example: '2026-09-01', format: 'date' })
  from!: string;

  @ApiProperty({ example: '2026-09-30', format: 'date' })
  to!: string;

  @ApiProperty({ type: [UserMovieCalendarItemDto] })
  watched!: UserMovieCalendarItemDto[];

  @ApiProperty({ type: [UserMovieCalendarItemDto] })
  releaseNotifications!: UserMovieCalendarItemDto[];
}
