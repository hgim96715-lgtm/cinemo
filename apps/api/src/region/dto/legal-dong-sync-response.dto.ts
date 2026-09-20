import { ApiProperty } from '@nestjs/swagger';

export class LegalDongSyncResponseDto {
  @ApiProperty({
    example: 20560,
    description: '동기화된 법정동 데이터 수',
  })
  syncedCount!: number;
}
