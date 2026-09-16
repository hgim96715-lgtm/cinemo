import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TmdbService } from './tmdb.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { UpsertProviderOverrideDto } from './dto/upsert-provider-override.dto';

@ApiTags('tmdb')
@ApiBearerAuth()
@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Public()
  @Get('movie/:movieId')
  getMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.tmdbService.getMovie(movieId);
  }

  @Get('genres')
  @ApiQuery({ name: 'language', required: false, example: 'ko' })
  getMovieGenres(@Query('language') language?: string) {
    return this.tmdbService.getMovieGenres(language ?? 'ko');
  }

  @Get('discover')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  discover(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.discoverMovies({}, page);
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true, example: '인셉션' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  search(
    @Query('q') q: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.searchMovies(q, page);
  }

  @Roles('admin')
  @Get('provider-overrides')
  listProviderOverrides(@Query('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.tmdbService.listProviderOverrides(tmdbId);
  }

  @Roles('admin')
  @Post('provider-overrides')
  upsertProviderOverride(
    @UserId() userId: string,
    @Body() dto: UpsertProviderOverrideDto,
  ) {
    return this.tmdbService.upsertProviderOverride(userId, dto);
  }
}
