import { ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDongResultDto } from './legal-dong-result.dto';

export class LegalDongHeadItemDto {
  @ApiPropertyOptional({
    example: 20560,
    description: '전체 검색 결과 수',
  })
  totalCount?: number;

  @ApiPropertyOptional({
    example: '1000',
    description: '페이지당 결과 수',
  })
  numOfRows?: string;

  @ApiPropertyOptional({
    example: '1',
    description: '현재 페이지 번호',
  })
  pageNo?: string;

  @ApiPropertyOptional({ example: 'JSON', description: '응답 형식' })
  type?: string;

  @ApiPropertyOptional({
    type: LegalDongResultDto,
    description: 'API 처리 결과',
  })
  RESULT?: LegalDongResultDto;
}
