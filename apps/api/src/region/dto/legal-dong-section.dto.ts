import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDongHeadItemDto } from './legal-dong-head-item.dto';
import { LegalDongRowDto } from './legal-dong-row.dto';

const toArray = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
};

export class LegalDongSectionDto {
  @ApiPropertyOptional({
    type: [LegalDongHeadItemDto],
    description: '응답 메타데이터 목록',
  })
  @Transform(toArray)
  head?: LegalDongHeadItemDto[];

  @ApiPropertyOptional({
    type: [LegalDongRowDto],
    description: '법정동 데이터 목록',
  })
  @Transform(toArray)
  row?: LegalDongRowDto[];
}
