import { ApiProperty } from '@nestjs/swagger';

export class KakaoCinemaSyncResponseDto {
  @ApiProperty({
    description: '저장 또는 갱신된 영화관 수',
    example: 12,
  })
  syncedCount!: number;
}
