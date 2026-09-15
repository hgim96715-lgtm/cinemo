import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { LobbyBoardService } from './lobby-board.service';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { MovieChartResponseDto } from './dto/movie-chart.dto';
import { MovieChartSnapshotService } from './movie-chart-snapshot.service';
import { MovieChartHistoryQueryDto } from './dto/movie-chart-history-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { BackfillRangeDto } from './dto/backfill-range.dto';
import { BackfillResponseDto } from './dto/backfill-response.dto';
import { MovieChartStatsResponseDto } from './dto/movie-chart-stats.dto';
import { MovieChartHistoryItemDto } from './dto/movie-chart-history.dto';
import { UpcomingMoviesResponseDto } from './dto/upcoming-movie.dto';

@ApiTags('lobby')
@Controller('lobby')
export class LobbyBoardController {
  private readonly logger = new Logger(LobbyBoardController.name);

  constructor(
    private readonly lobbyBoardService: LobbyBoardService,
    private readonly movieChartSnapshotService: MovieChartSnapshotService,
  ) {}

  @Public()
  @Get('board')
  getBoard() {
    return this.lobbyBoardService.getBoard();
  }

  @Public()
  @Get('movie-chart')
  @ApiOkResponse({ type: MovieChartResponseDto })
  getMovieChart() {
    return this.lobbyBoardService.getMovieChart();
  }

  @Public()
  @Get('movie-chart/history')
  @ApiQuery({ type: MovieChartHistoryQueryDto })
  @ApiOkResponse({ type: [MovieChartHistoryItemDto] })
  getMovieChartHistory(@Query() query: MovieChartHistoryQueryDto) {
    return this.movieChartSnapshotService.getSnapshots(query.from, query.to);
  }

  @Public()
  @Get('movie-chart/stats')
  @ApiQuery({ type: MovieChartHistoryQueryDto })
  @ApiOkResponse({ type: MovieChartStatsResponseDto })
  getMovieChartStats(@Query() query: MovieChartHistoryQueryDto) {
    return this.movieChartSnapshotService.getStats(query.from, query.to);
  }

  @Public()
  @Get('upcoming')
  @ApiOkResponse({ type: UpcomingMoviesResponseDto })
  getUpcomingMovies(
    @Query('month') month: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.lobbyBoardService.getUpcomingMovies(month, page, limit);
  }

  @Post('visit')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
  @ApiForbiddenResponse({ description: '접근 권한이 없습니다' })
  recordVisit(@UserId() userId: string) {
    return this.lobbyBoardService.recordVisit(userId);
  }

  @Post('movie-chart/backfill')
  @Roles('admin')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '영화 차트 과거 데이터 백필',
    description: '지정한 기간의 KOBIS 데이터를 백그라운드에서 수집합니다.',
  })
  @ApiAcceptedResponse({
    type: BackfillResponseDto,
    description: '백필 작업이 시작되었습니다.',
  })
  @ApiBadRequestResponse({ description: '날짜 범위가 올바르지 않습니다.' })
  @ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
  @ApiForbiddenResponse({ description: '관리자 권한이 필요합니다' })
  backfillMovieChart(@Body() dto: BackfillRangeDto): BackfillResponseDto {
    void this.lobbyBoardService
      .backfillMovieChart(dto.from, dto.to)
      .catch((error: unknown) => {
        this.logger.error(
          '영화 차트 백필 실패',
          error instanceof Error ? error.stack : String(error),
        );
      });

    return {
      message: `백필 시작: ${dto.from} ~ ${dto.to}`,
    };
  }
}
