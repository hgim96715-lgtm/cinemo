import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class UpdateWatchedAtDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId: number;

  @ApiProperty({ example: '2026-09-02' })
  @IsDateString()
  watchedAt: string;
}
