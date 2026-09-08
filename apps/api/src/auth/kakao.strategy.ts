import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { EnvKeys } from '../config/env.keys';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>(EnvKeys.KAKAO_REST_API_KEY),
      clientSecret: configService.get<string>(
        EnvKeys.KAKAO_OAUTH_CLIENT_SECRET,
      ),
      callbackURL: configService.getOrThrow<string>(EnvKeys.KAKAO_CALLBACK_URL),
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const kakaoAccount = profile._json?.kakao_account as
      | {
          email?: string;
          profile?: {
            nickname?: string;
          };
        }
      | undefined;

    const email = kakaoAccount?.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('카카오 이메일 제공 동의가 필요합니다.');
    }

    return {
      provider: 'kakao' as const,
      providerAccountId: profile.id,
      email,
      nickname:
        kakaoAccount?.profile?.nickname?.trim() ||
        profile.displayName ||
        '카카오 사용자',
    };
  }
}
