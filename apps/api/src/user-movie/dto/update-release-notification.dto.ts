import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateReleaseNotificationDto {
  @ApiProperty({ example: 550 })
  @IsInt()
  @Min(1)
  tmdbId: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
