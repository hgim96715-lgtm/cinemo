import { ApiProperty } from '@nestjs/swagger';
import { KakaoPlaceDocumentDto } from './kakao-place-document.dto';
import { KakaoPlaceMetaDto } from './kakao-place-meta.dto';

export class KakaoPlaceResponseDto {
  @ApiProperty({
    description: '검색된 장소 목록',
    type: [KakaoPlaceDocumentDto],
  })
  documents: KakaoPlaceDocumentDto[];

  @ApiProperty({
    description: '검색 결과 페이지 정보',
    type: KakaoPlaceMetaDto,
  })
  meta: KakaoPlaceMetaDto;
}
