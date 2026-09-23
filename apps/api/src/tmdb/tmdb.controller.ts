import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TmdbService } from './tmdb.service';
import { Public } from '../auth/decorators/public.decorator';
import { EnvKeys } from '../config/env.keys';
import { MovieDetailDto } from './dto/movie-detail.dto';
import { MovieDiscoverResponseDto } from './dto/movie-discover.dto';
import { MovieGenresResponseDto } from './dto/movie-genre.dto';
import { MovieSearchResponseDto } from './dto/movie-search.dto';

@ApiTags('tmdb')
@ApiBearerAuth()
@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Public()
  @Get('movie/:movieId')
  @ApiOperation({ summary: '영화 상세 조회' })
  @ApiOkResponse({ type: MovieDetailDto })
  getMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
  ): Promise<MovieDetailDto> {
    return this.tmdbService.getMovie(movieId);
  }

  @Public()
  @Get('debug/movie/:movieId/raw')
  @ApiOperation({ summary: 'TMDB 영화 원본 응답 조회' })
  getRawMovieResponse(
    @Param('movieId', ParseIntPipe) movieId: number,
  ): Promise<unknown> {
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
  @ApiQuery({ name: 'language', required: false, example: 'ko' })
  getMovieGenres(
    @Query('language') language?: string,
  ): Promise<MovieGenresResponseDto> {
    return this.tmdbService.getMovieGenres(language ?? 'ko');
  }

  @Get('discover')
  @ApiOperation({ summary: '영화 탐색 목록 조회' })
  @ApiOkResponse({ type: MovieDiscoverResponseDto })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  discover(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<MovieDiscoverResponseDto> {
    return this.tmdbService.discoverMovies({}, page);
  }

  @Get('search')
  @ApiOperation({ summary: '영화 검색' })
  @ApiOkResponse({ type: MovieSearchResponseDto })
  @ApiQuery({ name: 'q', required: true, example: '인셉션' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  search(
    @Query('q') q: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<MovieSearchResponseDto> {
    return this.tmdbService.searchMovies(q, page);
  }
}
