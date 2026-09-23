import { ApiProperty } from '@nestjs/swagger';

export class UserMovieMonthlyStatDto {
  @ApiProperty({ example: 1 })
  month!: number;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class UserMovieStatsResponseDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 24 })
  total!: number;

  @ApiProperty({ type: [UserMovieMonthlyStatDto] })
  monthly!: UserMovieMonthlyStatDto[];
}
