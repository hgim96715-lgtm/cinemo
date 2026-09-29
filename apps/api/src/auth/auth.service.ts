import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DEFAULT_PROFILE, normalizeProfileTags } from '@cinemo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './jwt-payload';
import { AdminService } from '../admin/admin.service';
import {
  AuthProvider,
  LoginProvider,
  Prisma,
} from '../generated/prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SocialProfile } from './types/social-profile.type';
import { createHash, randomBytes, randomInt } from 'crypto';
import { MailService } from './mail.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { AuthUserResponseDto } from './dto/auth-user-response.dto';
import type { AvailabilityResponseDto } from './dto/availability-response.dto';
import type { MessageResponseDto } from './dto/message-response.dto';
import type { AuthUserRow, PublicProfile } from './types/auth-service.type';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyPasswordResetCodeDto } from './dto/verify-password-reset-code.dto';

const BCRYPT_ROUNDS = 10;

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  nickname: true,
  role: true,
  lastLoginProvider: true,
  isTestAccount: true,
  bio: true,
  profilePublic: true,
  tags: true,
} as const;

function toAuthUser(user: AuthUserRow) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
    lastLoginProvider: user.lastLoginProvider,
    isTestAccount: user.isTestAccount,
    bio: user.bio ?? DEFAULT_PROFILE.bio,
    profilePublic: user.profilePublic ?? DEFAULT_PROFILE.profilePublic,
    tags: normalizeProfileTags(user.tags ?? []),
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
    private readonly mailService: MailService,
  ) {}

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
  private createRefreshToken() {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashRefreshToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return {
      token,
      tokenHash,
      expiresAt,
    };
  }

  private async buildAuthResponse(
    user: AuthUserRow,
    message: string,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshTokenData = this.createRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenData.tokenHash,
        expiresAt: refreshTokenData.expiresAt,
      },
    });
    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      user: toAuthUser(user),
      message,
    };
  }
  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);
    const now = new Date();
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= now) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const revoked = await this.prisma.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });
    if (revoked.count !== 1) {
      throw new UnauthorizedException('리프레시 토큰이 이미 사용되었습니다.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: AUTH_USER_SELECT,
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return this.buildAuthResponse(user, '토큰 갱신 성공');
  }

  async createOAuthLoginCode(userId: string) {
    const rawCode = randomBytes(32).toString('base64url');
    const codeHash = createHash('sha256').update(rawCode).digest('hex');

    await this.prisma.oAuthLoginCode.deleteMany({
      where: {
        userId,
        consumedAt: null,
      },
    });
    await this.prisma.oAuthLoginCode.create({
      data: {
        userId,
        codeHash,
        expiresAt: new Date(Date.now() + 60 * 1000),
      },
    });

    return rawCode;
  }

  async exchangeOAuthLoginCode(rawCode: string): Promise<AuthResponseDto> {
    const codeHash = createHash('sha256').update(rawCode).digest('hex');
    const now = new Date();

    const code = await this.prisma.oAuthLoginCode.findUnique({
      where: { codeHash },
      select: { id: true, userId: true },
    });

    if (!code) {
      throw new UnauthorizedException('OAuth code가 유효하지 않습니다.');
    }

    const consumed = await this.prisma.oAuthLoginCode.updateMany({
      where: {
        id: code.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });

    if (consumed.count !== 1) {
      throw new UnauthorizedException(
        'OAuth code가 만료되었거나 이미 사용되었습니다.',
      );
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: code.userId },
      select: AUTH_USER_SELECT,
    });

    return this.buildAuthResponse(user, 'Google 로그인 성공');
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const nickname = dto.nickname.trim();
    const [existingByEmail, existingByNickname] = await Promise.all([
      this.prisma.user.findUnique({
        where: { email },
      }),
      this.prisma.user.findUnique({ where: { nickname } }),
    ]);
    if (existingByEmail)
      throw new ConflictException('이미 사용중인 이메일입니다.');
    if (existingByNickname)
      throw new ConflictException('이미 사용중인 닉네임입니다.');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, nickname, passwordHash },
    });
    return this.buildAuthResponse(user, '회원가입 성공');
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok)
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginProvider: LoginProvider.email },
      select: AUTH_USER_SELECT,
    });

    if (user.role !== 'admin')
      await this.adminService.recordGuestLogin(updatedUser.id);
    return this.buildAuthResponse(updatedUser, '로그인 성공');
  }

  async logout(dto: RefreshTokenDto): Promise<MessageResponseDto> {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: '로그아웃 성공',
    };
  }

  async findOrCreateSocialUser(profile: SocialProfile) {
    const provider = profile.provider as AuthProvider;
    const existingSocialAccount = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingSocialAccount) {
      return existingSocialAccount.user;
    }
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (existingUser) {
      await this.prisma.socialAccount.create({
        data: {
          userId: existingUser.id,
          provider,
          providerAccountId: profile.providerAccountId,
        },
      });
      return existingUser;
    }
    const nickname =
      profile.nickname.trim() ||
      `google-${profile.providerAccountId.slice(0, 8)}`;

    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      BCRYPT_ROUNDS,
    );
    return this.prisma.user.create({
      data: {
        email: profile.email,
        nickname,
        passwordHash,
        socialAccounts: {
          create: {
            provider,
            providerAccountId: profile.providerAccountId,
          },
        },
      },
    });
  }

  async loginWithSocial(profile: SocialProfile) {
    const user = await this.findOrCreateSocialUser(profile);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginProvider: profile.provider },
    });
    if (updatedUser.role !== 'admin') {
      await this.adminService.recordGuestLogin(user.id);
    }
    return updatedUser;
  }

  async getMe(userId: string): Promise<AuthUserResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: AUTH_USER_SELECT,
    });
    return toAuthUser(user);
  }

  private async isAvailable(where: { email: string } | { nickname: string }) {
    const existing = await this.prisma.user.findUnique({
      where,
      select: { id: true },
    });
    return { available: !existing };
  }

  async checkEmail(email: string): Promise<AvailabilityResponseDto> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { available: false };
    return this.isAvailable({ email: normalized });
  }

  async checkNickname(nickname: string): Promise<AvailabilityResponseDto> {
    const normalized = nickname.trim();
    if (!normalized) return { available: false };
    return this.isAvailable({ nickname: normalized });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthUserResponseDto> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.nickname !== undefined) {
      const nickname = dto.nickname.trim();
      const taken = await this.prisma.user.findUnique({
        where: { nickname },
        select: { id: true },
      });
      if (taken && taken.id !== userId)
        throw new ConflictException('이미 사용중인 닉네임입니다.');
      data.nickname = nickname;
    }
    if (dto.bio !== undefined) {
      data.bio =
        dto.bio === null || dto.bio.trim() === '' ? null : dto.bio.trim();
    }
    if (dto.profilePublic !== undefined) data.profilePublic = dto.profilePublic;
    if (dto.tags !== undefined) data.tags = normalizeProfileTags(dto.tags);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: AUTH_USER_SELECT,
    });
    return toAuthUser(user);
  }

  async getPublicProfile(nickname: string): Promise<PublicProfile> {
    const user = await this.prisma.user.findUnique({
      where: { nickname: nickname.trim() },
      select: {
        nickname: true,
        profilePublic: true,
        bio: true,
        tags: true,
      },
    });
    if (!user) throw new NotFoundException('프로필을 찾을 수 없습니다.');
    if (!user.profilePublic) {
      return { nickname: user.nickname, profilePublic: false };
    }
    return {
      nickname: user.nickname,
      profilePublic: true,
      bio: user.bio,
      tags: normalizeProfileTags(user.tags ?? []),
    };
  }

  // 비밀번호 찾기

  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<MessageResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const message = '입력한 이메일로 인증 코드를 확인해 주세요.';

    if (!user) {
      return { message };
    }
    const code = randomInt(100_000, 1_000_000).toString();
    const tokenHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          verifiedAt: null,
          usedAt: null,
        },
      }),
    ]);
    await this.mailService.sendPasswordResetCodeEmail({
      to: user.email,
      nickname: user.nickname,
      code,
    });
    return { message };
  }

  async verifyPasswordResetCode(
    dto: VerifyPasswordResetCodeDto,
  ): Promise<MessageResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('인증 코드가 올바르지 않습니다.');
    }

    const tokenHash = createHash('sha256').update(dto.code).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        usedAt: null,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException(
        '인증 코드가 올바르지 않거나 만료되었습니다.',
      );
    }

    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { verifiedAt: new Date() },
    });

    return {
      message: '인증 코드가 확인되었습니다.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const tokenHash = createHash('sha256').update(dto.code).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
        user: {
          email,
        },
      },
      include: {
        user: {
          select: { passwordHash: true },
        },
      },
    });
    if (!resetToken) {
      throw new UnauthorizedException(
        '비밀번호 재설정 링크가 만료되었거나 올바르지 않아요.',
      );
    }
    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      resetToken.user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        '기존에 사용한 비밀번호와 다른 비밀번호를 입력해 주세요.',
      );
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });
      const result = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (result.count !== 1) {
        throw new UnauthorizedException(
          '비밀번호 재설정 링크가 이미 사용되었어요.',
        );
      }
    });
    return {
      message: '비밀번호가 변경되었어요.',
    };
  }
}
