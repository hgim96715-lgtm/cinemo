import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpsertUserMovieDto } from './dto/upsert-user-movie.dto';
import { UserId } from '../auth/decorators/user-id.decorator';
import { UserMovieKind } from '../generated/prisma/enums';
import { UpdateDisplayDto } from './dto/update-display.dto';

@ApiTags('user-movies')
@ApiBearerAuth()
@Controller('user-movies')
export class UserMovieController {
  constructor(private readonly userMovieService: UserMovieService) {}

  @Post('toggle')
  toggle(@UserId() userId: string, @Body() dto: UpsertUserMovieDto) {
    return this.userMovieService.toggle(userId, dto.tmdbId, dto.kind);
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

  @Get()
  listByKind(
    @UserId() userId: string,
    @Query('kind', new ParseEnumPipe(UserMovieKind)) kind: UserMovieKind,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
  ) {
    return this.userMovieService.listByKind(userId, kind, page, limit);
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
