import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, Min } from 'class-validator';

export class UpdateReleaseNotificationDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: '2026-09-16', format: 'date' })
  @IsDateString()
  releaseDate: string;
}
