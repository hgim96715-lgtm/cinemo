import { Module } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { UserMovieController } from './user-movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { AuthModule } from '../auth/auth.module';

import { ReleaseNotificationController } from './release-notification.controller';
import { ReleaseNotificationService } from './release-notification.service';

@Module({
  imports: [TmdbModule, AuthModule],
  controllers: [UserMovieController, ReleaseNotificationController],
  providers: [UserMovieService, ReleaseNotificationService],
})
export class UserMovieModule {}
