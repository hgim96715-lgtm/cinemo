import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import authConfig from '../config/auth.config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt-strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles.guard';
import { AdminModule } from '../admin/admin.module';
import { GoogleStrategy } from './google.strategy';
import { KakaoStrategy } from './kakao.strategy';
import { NaverStrategy } from './naver.strategy';
import { MailService } from './mail.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.secret,
        signOptions: { expiresIn: config.expiresIn },
      }),
    }),
    AdminModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    JwtStrategy,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    AuthService,
    MailService,
  ],
  exports: [JwtModule, AuthService, MailService],
})
export class AuthModule {}
