import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  NotFoundException,
  ParseIntPipe,
  Query,
  Body,
  Post,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
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
import { MoviePoolBackfillDto } from './dto/movie-pool-backfill.dto';
import { MoviePoolBackfillResponseDto } from './dto/movie-pool-backfill-response.dto';

@ApiTags('tmdb')
@Roles('admin')
@ApiBearerAuth()
@Controller('tmdb')
export class TmdbController {
  private readonly logger = new Logger(TmdbController.name);

  constructor(private readonly tmdbService: TmdbService) {}

  @Post('movie-pool/backfill')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'movie_pool 백필',
    description: 'TMDB discover 목록을 기반으로 movie_pool을 채웁니다.',
  })
  @ApiAcceptedResponse({ type: MoviePoolBackfillResponseDto })
  backfillMoviePool(
    @Body() dto: MoviePoolBackfillDto,
  ): MoviePoolBackfillResponseDto {
    void this.tmdbService
      .backfillMoviePool(dto.pages, dto.force)
      .catch((error: unknown) => {
        this.logger.error(
          'movie_pool 백필 실패',
          error instanceof Error ? error.stack : String(error),
        );
      });

    return {
      message: 'movie_pool 백필을 시작했습니다.',
      pages: dto.pages,
    };
  }

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
