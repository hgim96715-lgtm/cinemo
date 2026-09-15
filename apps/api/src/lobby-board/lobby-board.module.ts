import { Module } from '@nestjs/common';
import { LobbyBoardService } from './lobby-board.service';
import { LobbyBoardController } from './lobby-board.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { AdminModule } from '../admin/admin.module';
import { MovieChartSnapshotService } from './movie-chart-snapshot.service';

@Module({
  imports: [TmdbModule, AdminModule],
  controllers: [LobbyBoardController],
  providers: [LobbyBoardService, MovieChartSnapshotService],
})
export class LobbyBoardModule {}
