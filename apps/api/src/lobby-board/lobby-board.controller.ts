import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { LobbyBoardService } from './lobby-board.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { MovieChartResponseDto } from './dto/movie-chart.dto';

@ApiTags('lobby')
@Controller('lobby')
export class LobbyBoardController {
  constructor(private readonly lobbyBoardService: LobbyBoardService) {}

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
  @Get('upcoming')
  getUpcomingMovies(
    @Query('month') month: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.lobbyBoardService.getUpcomingMovies(month, page, limit);
  }

  @ApiBearerAuth()
  @Post('visit')
  recordVisit(@UserId() userId: string) {
    return this.lobbyBoardService.recordVisit(userId);
  }
}
