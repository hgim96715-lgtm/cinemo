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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { UserId } from './decorators/user-id.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ExchangeOAuthCodeDto } from './dto/exchange-oauth-code.dto';
import { AuthGuard } from '@nestjs/passport';
import type { SocialProfile } from './types/social-profile.type';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('check-email')
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  checkEmail(@Query('email') email: string) {
    return this.authService.checkEmail(email);
  }

  @Public()
  @Get('check-nickname')
  @ApiOperation({ summary: '닉네임 중복 확인' })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  checkNickname(@Query('nickname') nickname: string) {
    return this.authService.checkNickname(nickname);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Google 로그인 시작' })
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Google 로그인 페이지로 이동
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google 로그인 콜백' })
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
  @ApiOperation({ summary: 'Google OAuth 코드 교환' })
  @ApiOkResponse({ type: AuthResponseDto })
  exchangeGoogleCode(@Body() dto: ExchangeOAuthCodeDto) {
    return this.authService.exchangeOAuthLoginCode(dto.code);
  }

  @Public()
  @Get('kakao')
  @ApiOperation({ summary: 'Kakao 로그인 시작' })
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {
    // 카카오 로그인 페이지로 이동
  }

  @Public()
  @Get('kakao/callback')
  @ApiOperation({ summary: 'Kakao 로그인 콜백' })
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
  @ApiOperation({ summary: 'Naver 로그인 시작' })
  @UseGuards(AuthGuard('naver'))
  naverLogin() {
    // 네이버 로그인 페이지로 이동
  }

  @Public()
  @Get('naver/callback')
  @ApiOperation({ summary: 'Naver 로그인 콜백' })
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
  @ApiOperation({ summary: '비밀번호 재설정 요청' })
  @ApiOkResponse({ type: MessageResponseDto })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    const frontendUrl =
      this.configService.getOrThrow<string>('auth.frontendUrl');

    return this.authService.requestPasswordReset(dto, frontendUrl);
  }

  @Public()
  @Post('password-reset/confirm')
  @ApiOperation({ summary: '비밀번호 재설정 확정' })
  @ApiOkResponse({ type: MessageResponseDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: '내 사용자 정보 조회' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  getMe(@UserId() userId: string) {
    return this.authService.getMe(userId);
  }

  @ApiBearerAuth()
  @Patch('profile')
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  updateProfile(@UserId() userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }
}
