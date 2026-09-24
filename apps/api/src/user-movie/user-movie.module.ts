import { Module } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { UserMovieController } from './user-movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { AuthModule } from '../auth/auth.module';

import { ReleaseNotificationController } from './release-notification.controller';
import { UserMovieStatsService } from './user-movie-stats.service';
import { UserMovieDisplayService } from './user-movie-display.service';
import { UserMovieReleaseNotificationService } from './user-movie-release-notification.service';
import { UserMovieCalendarService } from './user-movie-calendar.service';

@Module({
  imports: [TmdbModule, AuthModule],
  controllers: [UserMovieController, ReleaseNotificationController],
  providers: [
    UserMovieService,
    UserMovieCalendarService,
    UserMovieStatsService,
    UserMovieDisplayService,
    UserMovieReleaseNotificationService,
  ],
})
export class UserMovieModule {}
