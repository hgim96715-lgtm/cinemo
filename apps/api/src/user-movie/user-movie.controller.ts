import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UpsertUserMovieDto } from './dto/upsert-user-movie.dto';
import { UserId } from '../auth/decorators/user-id.decorator';
import { UpdateDisplayDto } from './dto/update-display.dto';
import { AddWatchedMovieDto } from './dto/add-watched-movie.dto';
import { UpdateWatchedAtDto } from './dto/update-watched-at.dto';
import { UpdateViewingDetailsDto } from './dto/update-viewing-details.dto';
import { UpdateReleaseNotificationDto } from './dto/update-release-notification.dto';
import { UserMovieListResponseDto } from './dto/user-movie-list-response.dto';
import { UserMovieListQueryDto } from './dto/user-movie-list-query.dto';
import { UserMovieStatsService } from './user-movie-stats.service';
import { UserMovieDisplayService } from './user-movie-display.service';
import { UserMovieReleaseNotificationService } from './user-movie-release-notification.service';
import { ToggleUserMovieResponseDto } from './dto/toggle-user-movie-response.dto';
import { UserMovieStatusResponseDto } from './dto/user-movie-status-response.dto';
import { UserMovieCountsResponseDto } from './dto/user-movie-counts-response.dto';
import { UserMovieStatsResponseDto } from './dto/user-movie-stats-response.dto';
import { UserMovieDisplayResponseDto } from './dto/user-movie-display-response.dto';
import { UserMovieDisplayedResponseDto } from './dto/user-movie-displayed-response.dto';
import { WishMovieDetailResponseDto } from './dto/wish-movie-detail-response.dto';
import { UserMovieRecordResponseDto } from './dto/user-movie-record-response.dto';
import { ReleaseNotificationResponseDto } from './dto/release-notification-response.dto';
import { UserMovieCalendarService } from './user-movie-calendar.service';
import { UserMovieCalendarQueryDto } from './dto/user-movie-calendar-query.dto';
import { UserMovieCalendarResponseDto } from './dto/user-movie-calendar-response.dto';

@ApiTags('user-movies')
@ApiBearerAuth()
@Controller('user-movies')
export class UserMovieController {
  constructor(
    private readonly userMovieService: UserMovieService,
    private readonly userMovieStatsService: UserMovieStatsService,
    private readonly userMovieDisplayService: UserMovieDisplayService,
    private readonly userMovieReleaseNotificationService: UserMovieReleaseNotificationService,
    private readonly userMovieCalendarService: UserMovieCalendarService,
  ) {}

  @Post('toggle')
  @ApiOperation({
    summary: '영화 보관 상태 토글',
    description: '보고 싶은 영화 또는 관람 기록 추가·삭제',
  })
  @ApiCreatedResponse({ type: ToggleUserMovieResponseDto })
  toggle(@UserId() userId: string, @Body() dto: UpsertUserMovieDto) {
    return this.userMovieService.toggle(userId, dto.tmdbId, dto.kind);
  }

  @Post('watched-at')
  @ApiOperation({
    summary: '관람 기록 추가',
    description: '영화 관람 기록 추가 및 관람일 저장',
  })
  @ApiOkResponse({ type: UserMovieRecordResponseDto })
  addWatchedMovie(@UserId() userId: string, @Body() dto: AddWatchedMovieDto) {
    return this.userMovieService.addWatchedMovie(
      userId,
      dto.tmdbId,
      dto.watchedAt,
    );
  }

  @Patch('watched-at')
  @ApiOperation({
    summary: '관람일 수정',
    description: '기존 관람 기록의 관람일 수정',
  })
  @ApiOkResponse({ type: UserMovieRecordResponseDto })
  updateWatchedAt(@UserId() userId: string, @Body() dto: UpdateWatchedAtDto) {
    return this.userMovieService.updateWatchedAt(
      userId,
      dto.tmdbId,
      dto.watchedAt,
    );
  }

  @Patch('viewing-details')
  @ApiOperation({
    summary: '관람 상세 정보 수정',
    description: '관람 장소·방식·후기·평점 수정',
  })
  @ApiOkResponse({ type: UserMovieRecordResponseDto })
  updateViewingDetails(
    @UserId() userId: string,
    @Body() dto: UpdateViewingDetailsDto,
  ) {
    return this.userMovieService.updateViewingDetails(userId, dto);
  }

  @Delete('watched-at/:tmdbId')
  @ApiOperation({
    summary: '관람 기록 삭제',
    description: '영화 관람 기록 삭제',
  })
  @ApiOkResponse({ type: ToggleUserMovieResponseDto })
  removeWatchedMovie(
    @UserId() userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    return this.userMovieService.removeWatchedMovie(userId, tmdbId);
  }

  @Get('status')
  @ApiOperation({
    summary: '영화 보관 상태 조회',
    description: '특정 영화의 보고 싶은 영화·관람 기록 여부 조회',
  })
  @ApiOkResponse({ type: UserMovieStatusResponseDto })
  getMovieStatus(
    @UserId() userId: string,
    @Query('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    return this.userMovieService.getMovieStatus(userId, tmdbId);
  }

  @Get('counts')
  @ApiOperation({
    summary: '보관 영화 개수 조회',
    description: '보고 싶은 영화·관람 기록 개수 조회',
  })
  @ApiOkResponse({ type: UserMovieCountsResponseDto })
  getCounts(@UserId() userId: string) {
    return this.userMovieService.getCounts(userId);
  }

  @Get('stats')
  @ApiOperation({
    summary: '연간 관람 통계 조회',
    description: '특정 연도의 월별 관람 횟수·총 관람 수 조회',
  })
  @ApiOkResponse({ type: UserMovieStatsResponseDto })
  getStats(
    @UserId() userId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.userMovieStatsService.getStats(userId, year);
  }

  @Get()
  @ApiOperation({
    summary: '보관 영화 목록 조회',
    description: '보고 싶은 영화 또는 관람 기록을 cursor 단위로 조회',
  })
  @ApiOkResponse({ type: UserMovieListResponseDto })
  listByKind(@UserId() userId: string, @Query() query: UserMovieListQueryDto) {
    return this.userMovieService.listByKind(
      userId,
      query.kind,
      query.take,
      query.cursor,
    );
  }

  @Get('wish-detail/:tmdbId')
  @ApiOperation({
    summary: '보고 싶은 영화 상세 정보 조회',
    description: 'wish 모달에 필요한 영화 상세 정보 조회',
  })
  @ApiOkResponse({ type: WishMovieDetailResponseDto })
  getWishMovieDetail(
    @UserId() userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    return this.userMovieService.getWishMovieDetail(userId, tmdbId);
  }

  @Post('display')
  @ApiOperation({
    summary: '홈 화면 영화 표시 상태 수정',
    description: '홈 화면 티켓 영역에 표시할 관람 영화 설정',
  })
  @ApiCreatedResponse({ type: UserMovieDisplayResponseDto })
  updateDisplay(@UserId() userId: string, @Body() dto: UpdateDisplayDto) {
    return this.userMovieDisplayService.updateDisplay(userId, dto);
  }

  @Get('displayed')
  @ApiOperation({
    summary: '홈 화면 표시 영화 조회',
    description: '홈 화면 티켓 영역에 표시된 관람 영화 조회',
  })
  @ApiOkResponse({ type: UserMovieDisplayedResponseDto })
  listDisplayed(@UserId() userId: string) {
    return this.userMovieDisplayService.listDisplayed(userId);
  }

  @Get('release-notification')
  @ApiOperation({
    summary: '개봉일 알림 설정 조회',
    description: '보고 싶은 영화의 개봉일 알림 설정 조회',
  })
  @ApiOkResponse({ type: ReleaseNotificationResponseDto })
  getReleaseNotification(
    @UserId() userId: string,
    @Query('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    return this.userMovieReleaseNotificationService.getReleaseNotification(
      userId,
      tmdbId,
    );
  }

  @Patch('release-notification')
  @ApiOperation({
    summary: '개봉일 알림 설정 변경',
    description: '보고 싶은 영화의 개봉일 알림 활성화·비활성화',
  })
  @ApiOkResponse({ type: ReleaseNotificationResponseDto })
  updateReleaseNotification(
    @UserId() userId: string,
    @Body() dto: UpdateReleaseNotificationDto,
  ) {
    return this.userMovieReleaseNotificationService.updateReleaseNotification(
      userId,
      dto,
    );
  }
  @Get('calendar')
  @ApiOperation({
    summary: '영화 캘린더 조회',
    description: '관람 기록과 개봉일 알림 일정을 기간별로 조회',
  })
  @ApiOkResponse({ type: UserMovieCalendarResponseDto })
  getCalendar(
    @UserId() userId: string,
    @Query() query: UserMovieCalendarQueryDto,
  ) {
    return this.userMovieCalendarService.getCalendar(
      userId,
      query.from,
      query.to,
    );
  }
}
