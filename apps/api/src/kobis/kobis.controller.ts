import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { KobisService } from './kobis.service';
import { Public } from '../auth/decorators/public.decorator';
import { KobisMovieInfoResponseDto } from './dto/kobis-movie-info-response.dto';
import { KobisMovieSearchResponseDto } from './dto/kobis-movie-search-response.dto';

@ApiTags('KOBIS')
@Controller('kobis')
export class KobisController {
  constructor(private readonly kobisService: KobisService) {}

  @Public()
  @Get('movie/:movieCd')
  @ApiOperation({ summary: 'KOBIS 영화 상세 원본 JSON 조회' })
  @ApiOkResponse({ type: KobisMovieInfoResponseDto })
  @ApiParam({
    name: 'movieCd',
    description: 'KOBIS 영화 코드',
    example: '202',
  })
  getMovieInfo(@Param('movieCd') movieCd: string) {
    return this.kobisService.getMovieInfo(movieCd);
  }

  @Public()
  @Get('movies/search')
  @ApiOperation({ summary: 'KOBIS 영화 이름 검색 원본 JSON 조회' })
  @ApiOkResponse({ type: KobisMovieSearchResponseDto })
  @ApiQuery({
    name: 'movieNm',
    required: true,
    description: '검색할 영화 이름',
    example: '디지몬 어드벤처',
  })
  searchMovies(@Query('movieNm') movieName: string) {
    return this.kobisService.searchMovies(movieName);
  }
}
