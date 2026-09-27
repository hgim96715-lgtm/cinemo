import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TmdbService } from './tmdb.service';
import { EnvKeys } from '../config/env.keys';
import { MovieDetailDto } from './dto/movie-detail.dto';
import { MovieDiscoverResponseDto } from './dto/movie-discover.dto';
import { MovieGenresResponseDto } from './dto/movie-genre.dto';
import { MovieSearchResponseDto } from './dto/movie-search.dto';
import {
  TmdbDiscoverQueryDto,
  TmdbLanguageQueryDto,
  TmdbSearchQueryDto,
} from './dto/tmdb-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('tmdb')
@Roles('admin')
@ApiBearerAuth()
@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('movie/:movieId')
  @ApiOperation({ summary: '영화 상세 조회' })
  @ApiOkResponse({ type: MovieDetailDto })
  getMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.tmdbService.getMovie(movieId);
  }

  @Get('debug/movie/:movieId/raw')
  @ApiOperation({ summary: 'TMDB 영화 원본 응답 조회' })
  getRawMovieResponse(@Param('movieId', ParseIntPipe) movieId: number) {
    const appEnv =
      process.env[EnvKeys.APP_ENV] ??
      (process.env[EnvKeys.NODE_ENV] === 'production' ? 'production' : 'local');

    if (appEnv === 'production') {
      throw new NotFoundException();
    }

    return this.tmdbService.getRawMovieResponse(movieId);
  }

  @Get('genres')
  @ApiOperation({ summary: '영화 장르 목록 조회' })
  @ApiOkResponse({ type: MovieGenresResponseDto })
  getMovieGenres(@Query() query: TmdbLanguageQueryDto) {
    return this.tmdbService.getMovieGenres(query.language);
  }

  @Get('discover')
  @ApiOperation({ summary: '영화 탐색 목록 조회' })
  @ApiOkResponse({ type: MovieDiscoverResponseDto })
  discover(@Query() query: TmdbDiscoverQueryDto) {
    return this.tmdbService.discoverMovies({}, query.page);
  }

  @Get('search')
  @ApiOperation({ summary: '영화 검색' })
  @ApiOkResponse({ type: MovieSearchResponseDto })
  search(@Query() query: TmdbSearchQueryDto) {
    return this.tmdbService.searchMovies(query.q, query.page);
  }
}
