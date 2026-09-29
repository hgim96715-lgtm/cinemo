import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { KmdbService } from './kmdb.service';
import { KmdbSearchQueryDto } from './dto/kmdb-search-query.dto';
import { KmdbSearchResponseDto } from './dto/kmdb-search-response.dto';

@ApiTags('KMDb')
@Controller('kmdb')
export class KmdbController {
  constructor(private readonly kmdbService: KmdbService) {}

  @Public()
  @Get('movies/search')
  @ApiOperation({ summary: 'KMDb 영화 검색' })
  @ApiOkResponse({
    type: KmdbSearchResponseDto,
  })
  searchMovies(@Query() query: KmdbSearchQueryDto) {
    return this.kmdbService.searchMovies(query.query, query.page, query.limit);
  }
}
