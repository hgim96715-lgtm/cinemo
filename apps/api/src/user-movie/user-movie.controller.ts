import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpsertUserMovieDto } from './dto/upsert-user-movie.dto';
import { UserId } from '../auth/decorators/user-id.decorator';
import { UserMovieKind } from '../generated/prisma/enums';
import { UpdateDisplayDto } from './dto/update-display.dto';
import { AddWatchedMovieDto } from './dto/add-watched-movie.dto';
import { UpdateWatchedAtDto } from './dto/update-watched-at.dto';

@ApiTags('user-movies')
@ApiBearerAuth()
@Controller('user-movies')
export class UserMovieController {
  constructor(private readonly userMovieService: UserMovieService) {}

  @Post('toggle')
  toggle(@UserId() userId: string, @Body() dto: UpsertUserMovieDto) {
    return this.userMovieService.toggle(userId, dto.tmdbId, dto.kind);
  }

  @Post('watched-at')
  addWatchedMovie(@UserId() userId: string, @Body() dto: AddWatchedMovieDto) {
    return this.userMovieService.addWatchedMovie(
      userId,
      dto.tmdbId,
      dto.watchedAt,
    );
  }

  @Patch('watched-at')
  updateWatchedAt(@UserId() userId: string, @Body() dto: UpdateWatchedAtDto) {
    return this.userMovieService.updateWatchedAt(
      userId,
      dto.tmdbId,
      dto.watchedAt,
    );
  }

  @Delete('watched-at/:tmdbId')
  removeWatchedMovie(
    @UserId() userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    return this.userMovieService.removeWatchedMovie(userId, tmdbId);
  }

  @Get('marks')
  getMarks(
    @UserId() userId: string,
    @Query('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    return this.userMovieService.getMarks(userId, tmdbId);
  }

  @Get('counts')
  getCounts(@UserId() userId: string) {
    return this.userMovieService.getCounts(userId);
  }

  @Get('calendar')
  getCalendar(
    @UserId() userId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.userMovieService.getCalendar(userId, year, month);
  }

  @Get('stats')
  getStats(
    @UserId() userId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.userMovieService.getStats(userId, year);
  }

  @Get()
  listByKind(
    @UserId() userId: string,
    @Query('kind', new ParseEnumPipe(UserMovieKind)) kind: UserMovieKind,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.userMovieService.listByKind(userId, kind, page, limit, {
      search,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
    });
  }

  @Post('display')
  updateDisplay(@UserId() userId: string, @Body() dto: UpdateDisplayDto) {
    return this.userMovieService.updateDisplay(userId, dto);
  }

  @Get('displayed')
  listDisplayed(@UserId() userId: string) {
    return this.userMovieService.listDisplayed(userId);
  }
}
