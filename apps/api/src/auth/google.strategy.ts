import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { EnvKeys } from '../config/env.keys';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>(EnvKeys.GOOGLE_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(
        EnvKeys.GOOGLE_CLIENT_SECRET,
      ),
      callbackURL: configService.getOrThrow<string>(
        EnvKeys.GOOGLE_CALLBACK_URL,
      ),
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException('Google 이메일을 확인할 수 없습니다.');
    }

    return {
      provider: 'google',
      providerAccountId: profile.id,
      email: email.trim().toLowerCase(),
      nickname: profile.displayName,
    };
  }
}
