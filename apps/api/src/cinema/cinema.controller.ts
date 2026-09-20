import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CinemaQueryDto } from './dto/cinema-query.dto';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { CinemaService } from './cinema.service';

@ApiTags('cinemas')
@Public()
@Controller('cinemas')
export class CinemaController {
  constructor(private readonly cinemaService: CinemaService) {}

  @Get()
  @ApiOperation({
    summary: '지역별 저장 영화관 조회',
    description: '외부 API를 호출하지 않고 DB에 저장된 영화관을 조회함',
  })
  @ApiOkResponse({ type: [CinemaResponseDto] })
  findCinemas(@Query() query: CinemaQueryDto) {
    return this.cinemaService.findCinemasByRegion(query.region);
  }
}
