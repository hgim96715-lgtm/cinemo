import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { PlaceSearchResultDto } from './dto/place-search-result.dto';

@ApiTags('places')
@ApiBearerAuth()
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('search')
  @ApiOperation({ summary: '영화관·관람 장소 검색' })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'CGV 압구정',
  })
  @ApiOkResponse({ type: [PlaceSearchResultDto] })
  search(@Query('q') query?: string) {
    return this.placesService.search(query ?? '');
  }
}
