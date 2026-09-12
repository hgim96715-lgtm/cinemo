import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  Patch,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { UserId } from './decorators/user-id.decorator';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ExchangeOAuthCodeDto } from './dto/exchange-oauth-code.dto';
import { AuthGuard } from '@nestjs/passport';
import type { SocialProfile } from './types/social-profile.type';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('check-email')
  checkEmail(@Query('email') email: string) {
    return this.authService.checkEmail(email);
  }

  @Public()
  @Get('check-nickname')
  checkNickname(@Query('nickname') nickname: string) {
    return this.authService.checkNickname(nickname);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Google 로그인 페이지로 이동
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @CurrentUser() profile: SocialProfile,
    @Res() response: Response,
  ) {
    const user = await this.authService.loginWithSocial(profile);
    const code = await this.authService.createOAuthLoginCode(user.id);

    const frontendUrl =
      this.configService.getOrThrow<string>('auth.frontendUrl');

    const callbackUrl = new URL('/auth/callback', frontendUrl);
    callbackUrl.searchParams.set('code', code);

    response.redirect(callbackUrl.toString());
  }

  @Public()
  @Post('google/exchange')
  exchangeGoogleCode(@Body() dto: ExchangeOAuthCodeDto) {
    return this.authService.exchangeOAuthLoginCode(dto.code);
  }

  @Public()
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {
    // 카카오 로그인 페이지로 이동
  }

  @Public()
  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @CurrentUser() profile: SocialProfile,
    @Res() response: Response,
  ) {
    const user = await this.authService.loginWithSocial(profile);
    const code = await this.authService.createOAuthLoginCode(user.id);

    const frontendUrl =
      this.configService.getOrThrow<string>('auth.frontendUrl');

    const callbackUrl = new URL('/auth/callback', frontendUrl);
    callbackUrl.searchParams.set('code', code);

    response.redirect(callbackUrl.toString());
  }

  @Public()
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin() {
    // 네이버 로그인 페이지로 이동
  }

  @Public()
  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(
    @CurrentUser() profile: SocialProfile,
    @Res() response: Response,
  ) {
    const user = await this.authService.loginWithSocial(profile);
    const code = await this.authService.createOAuthLoginCode(user.id);

    const frontendUrl =
      this.configService.getOrThrow<string>('auth.frontendUrl');

    const callbackUrl = new URL('/auth/callback', frontendUrl);
    callbackUrl.searchParams.set('code', code);

    response.redirect(callbackUrl.toString());
  }

  @Public()
  @Post('password-reset/request')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    const frontendUrl =
      this.configService.getOrThrow<string>('auth.frontendUrl');

    return this.authService.requestPasswordReset(dto, frontendUrl);
  }

  @Public()
  @Post('password-reset/confirm')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  getMe(@UserId() userId: string) {
    return this.authService.getMe(userId);
  }

  @ApiBearerAuth()
  @Patch('avatar')
  updateAvatar(@UserId() userId: string, @Body() dto: UpdateAvatarDto) {
    return this.authService.updateAvatar(userId, dto);
  }
  @ApiBearerAuth()
  @Patch('profile')
  updateProfile(@UserId() userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }
}
