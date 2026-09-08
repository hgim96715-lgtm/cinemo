import { Controller, Get, Post } from '@nestjs/common';
import { LobbyBoardService } from './lobby-board.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';

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
  @Get('weekly-reveal')
  getWeeklyRevealWinner() {
    return this.lobbyBoardService.getWeeklyRevealWinner();
  }

  @Public()
  @Get('upcoming')
  getUpcomingMovies() {
    return this.lobbyBoardService.getUpcomingMovies();
  }

  @ApiBearerAuth()
  @Post('visit')
  recordVisit(@UserId() userId: string) {
    return this.lobbyBoardService.recordVisit(userId);
  }
}
