import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { KakaoCinemaQueryDto } from './dto/kakao-cinema-query.dto';
import { KakaoCinemaPlaceDto } from './dto/kakao-cinema-place.dto';
import { KakaoPlaceService } from './kakao-place.service';
import { KakaoCinemaSyncResponseDto } from './dto/kakao-cinema-sync-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('kakao-places')
@Controller('kakao/places')
export class KakaoPlaceController {
  constructor(private readonly kakaoPlaceService: KakaoPlaceService) {}

  @Public()
  @Get('cinemas')
  @ApiOperation({
    summary: '지역별 영화관 검색',
    description: '카카오 Local API를 사용해 입력한 지역의 영화관을 검색함',
  })
  @ApiOkResponse({
    type: [KakaoCinemaPlaceDto],
  })
  searchCinemas(@Query() query: KakaoCinemaQueryDto) {
    return this.kakaoPlaceService.searchCinemasByRegion(query.region);
  }

  @Post('cinemas/sync')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({
    summary: '지역별 영화관 검색 결과 저장',
    description: '카카오 장소 검색 결과를 Cinema 테이블에 저장하거나 갱신함',
  })
  @ApiOkResponse({
    type: KakaoCinemaSyncResponseDto,
  })
  async syncCinemas(@Query() query: KakaoCinemaQueryDto) {
    const syncedCount = await this.kakaoPlaceService.syncCinemasByRegion(
      query.region,
    );

    return { syncedCount };
  }
}
