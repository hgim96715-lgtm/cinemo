import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';

@ApiTags('places')
@ApiBearerAuth()
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('search')
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'CGV 압구정',
  })
  search(@Query('q') query?: string) {
    return this.placesService.search(query ?? '');
  }
}
