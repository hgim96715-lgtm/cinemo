import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver-v2';
import { EnvKeys } from '../config/env.keys';
import type { SocialProfile } from './types/social-profile.type';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy as any, 'naver') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>(EnvKeys.NAVER_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(
        EnvKeys.NAVER_CLIENT_SECRET,
      ),
      callbackURL: configService.getOrThrow<string>(EnvKeys.NAVER_CALLBACK_URL),
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): SocialProfile {
    const email = profile.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('네이버 이메일 제공 동의가 필요합니다.');
    }

    return {
      provider: 'naver',
      providerAccountId: String(profile.id),
      email,
      nickname:
        profile.nickname?.trim() ||
        profile.name?.trim() ||
        `naver-${String(profile.id).slice(0, 8)}`,
    };
  }
}
