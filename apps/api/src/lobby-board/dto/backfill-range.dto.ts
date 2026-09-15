import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class BackfillRangeDto {
  @ApiProperty({
    example: '2026-09-01',
    description: '백필 시작일',
  })
  @IsDateString()
  from!: string;

  @ApiProperty({
    example: '2026-09-14',
    description: '백필 종료일',
  })
  @IsDateString()
  to!: string;
}
