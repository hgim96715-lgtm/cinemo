import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class UserMovieCalendarQueryDto {
  @ApiProperty({
    example: '2026-09-01',
    description: '조회 시작일',
    format: 'date',
  })
  @IsDateString()
  from!: string;

  @ApiProperty({
    example: '2026-09-30',
    description: '조회 종료일',
    format: 'date',
  })
  @IsDateString()
  to!: string;
}
