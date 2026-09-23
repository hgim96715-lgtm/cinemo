import { ApiProperty } from '@nestjs/swagger';

export class ReleaseNotificationResponseDto {
  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  releaseDate!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  sentAt!: string | null;
}
