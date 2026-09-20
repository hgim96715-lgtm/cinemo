import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LegalDongSectionDto } from './legal-dong-section.dto';

export class LegalDongResponseDto {
  @ApiProperty({
    type: [LegalDongSectionDto],
    description: '법정동 API 응답 영역',
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  })
  StanReginCd!: LegalDongSectionDto[];
}
