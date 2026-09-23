import { ApiProperty } from '@nestjs/swagger';

export class ReleaseNotificationFailureDto {
  @ApiProperty({ format: 'uuid' })
  notificationId!: string;

  @ApiProperty({ example: 550 })
  tmdbId!: number;

  @ApiProperty({ example: '메일 발송에 실패했습니다.' })
  reason!: string;
}

export class ReleaseNotificationRunResponseDto {
  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 9 })
  sent!: number;

  @ApiProperty({ example: 1 })
  failed!: number;

  @ApiProperty({ type: [ReleaseNotificationFailureDto] })
  failures!: ReleaseNotificationFailureDto[];
}
