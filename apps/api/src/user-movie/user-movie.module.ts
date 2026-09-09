import { Module } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { UserMovieController } from './user-movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { AuthModule } from '../auth/auth.module';
import { ReleaseNotificationCron } from './release-notification.cron';
import { ReleaseNotificationController } from './release-notification.controller';

@Module({
  imports: [TmdbModule, AuthModule],
  controllers: [UserMovieController, ReleaseNotificationController],
  providers: [UserMovieService, ReleaseNotificationCron],
})
export class UserMovieModule {}
