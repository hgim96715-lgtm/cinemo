import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class MovieChartHistoryQueryDto {
  @ApiProperty({
    example: '2026-09-01',
    description: '조회 시작일',
  })
  @IsDateString()
  from!: string;

  @ApiProperty({
    example: '2026-09-15',
    description: '조회 종료일',
  })
  @IsDateString()
  to!: string;
}
