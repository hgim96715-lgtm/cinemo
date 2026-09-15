import { ApiProperty } from '@nestjs/swagger';

export class BackfillResponseDto {
  @ApiProperty({
    example: '백필 시작: 2026-09-01 ~ 2026-09-14',
  })
  message!: string;
}
