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
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { LobbyBoardService } from './lobby-board.service';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiHeader,
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
import {
  LobbyBoardResponseDto,
  LobbyVisitResponseDto,
} from './dto/lobby-board.dto';
import { kstDateKey } from '../lib/date-kst';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../config/env.keys';

@ApiTags('lobby')
@Controller('lobby')
export class LobbyBoardController {
  private readonly logger = new Logger(LobbyBoardController.name);

  constructor(
    private readonly lobbyBoardService: LobbyBoardService,
    private readonly movieChartSnapshotService: MovieChartSnapshotService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('board')
  @ApiOperation({ summary: '로비 보드 조회' })
  @ApiOkResponse({ type: LobbyBoardResponseDto })
  getBoard(): Promise<LobbyBoardResponseDto> {
    return this.lobbyBoardService.getBoard();
  }

  @Public()
  @Get('movie-chart')
  @ApiOperation({ summary: '현재 영화 차트 조회' })
  @ApiOkResponse({ type: MovieChartResponseDto })
  getMovieChart() {
    return this.lobbyBoardService.getMovieChart();
  }

  @Public()
  @Get('movie-chart/history')
  @ApiOperation({ summary: '영화 차트 이력 조회' })
  @ApiOkResponse({ type: [MovieChartHistoryItemDto] })
  getMovieChartHistory(@Query() query: MovieChartHistoryQueryDto) {
    return this.movieChartSnapshotService.getSnapshots(query.from, query.to);
  }

  @Public()
  @Get('movie-chart/stats')
  @ApiOperation({ summary: '영화 차트 통계 조회' })
  @ApiOkResponse({ type: MovieChartStatsResponseDto })
  getMovieChartStats(@Query() query: MovieChartHistoryQueryDto) {
    return this.movieChartSnapshotService.getStats(query.from, query.to);
  }

  @Public()
  @Get('upcoming')
  @ApiOperation({ summary: '개봉 예정 영화 조회' })
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
  @ApiOperation({ summary: '로비 방문 기록' })
  @ApiOkResponse({ type: LobbyVisitResponseDto })
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
    description: '지정 기간 KOBIS 데이터의 백그라운드 수집',
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

  @ApiHeader({
    name: 'x-cron-secret',
    required: true,
    description: 'CRON_SECRET 환경변수 값',
  })
  @Public()
  @Post('movie-chart/cron')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '영화 차트 일일 수집' })
  async collectMovieChartCron(
    @Headers('x-cron-secret') secret: string | undefined,
    @Query('targetDate') targetDate?: string,
  ) {
    const cronSecret = this.configService.getOrThrow<string>(
      EnvKeys.CRON_SECRET,
    );
    if (secret !== cronSecret) {
      throw new UnauthorizedException('잘못된 cron secret입니다.');
    }

    const date = targetDate ?? kstDateKey(new Date(Date.now() - 86_400_000));

    const result = await this.lobbyBoardService.collectDailyMovieChart(date);

    return {
      message: '영화 차트 수집이 완료되었습니다.',
      ...result,
    };
  }
}
