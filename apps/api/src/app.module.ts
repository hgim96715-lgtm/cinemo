import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { UserMovieModule } from './user-movie/user-movie.module';
import { ReviewPostModule } from './review-post/review-post.module';
import { LobbyBoardModule } from './lobby-board/lobby-board.module';
import { CafeModule } from './cafe/cafe.module';
import { AdminModule } from './admin/admin.module';
import { AnonModule } from './anon/anon.module';
import { AiController } from './ai/ai.controller';
import { AiModule } from './ai/ai.module';
import { ProfilesModule } from './profiles/profiles.module';
import { GuideModule } from './guide/guide.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: { convert: true },
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    TicketModule,
    TmdbModule,
    UserMovieModule,
    ReviewPostModule,
    LobbyBoardModule,
    CafeModule,
    AdminModule,
    AnonModule,
    AiModule,
    ProfilesModule,
    GuideModule,
  ],
  controllers: [AppController, AiController],
  providers: [AppService],
})
export class AppModule {}
