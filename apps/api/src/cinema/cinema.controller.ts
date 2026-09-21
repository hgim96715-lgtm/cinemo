import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CinemaQueryDto } from './dto/cinema-query.dto';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { CinemaService } from './cinema.service';
import { CinemaSearchQueryDto } from './dto/cinema-search-query.dto';
import { CinemaPageResponseDto } from './dto/cinema-page-response.dto';
import { CinemaAnalysisResponseDto } from './dto/cinema-analysis-response.dto';

@ApiTags('cinemas')
@Public()
@Controller('cinemas')
export class CinemaController {
  constructor(private readonly cinemaService: CinemaService) {}

  @Get()
  @ApiOperation({
    summary: '영화관 조회',
    description:
      'region이 있으면 해당 지역의 영화관을 조회하고, 없으면 전체 영화관을 조회함',
  })
  @ApiOkResponse({ type: CinemaPageResponseDto })
  findCinemas(@Query() query: CinemaQueryDto) {
    return this.cinemaService.findCinemasByRegion(
      query.region,
      query.page,
      query.pageSize,
    );
  }

  @Get('search')
  @ApiOperation({
    summary: '전국 영화관 검색',
    description: '이름·브랜드·주소 기준으로 DB의 영화관을 검색함',
  })
  @ApiOkResponse({ type: [CinemaResponseDto] })
  searchCinemas(@Query() query: CinemaSearchQueryDto) {
    return this.cinemaService.searchCinemas(query.query);
  }

  @Get('analysis')
  @ApiOkResponse({ type: CinemaAnalysisResponseDto })
  findCinemaAnalysis(): Promise<CinemaAnalysisResponseDto> {
    return this.cinemaService.findCinemaAnalysis();
  }
}
