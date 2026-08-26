import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_AVATAR,
  DEFAULT_PROFILE,
  normalizeProfileTags,
  PublicProfile,
  type AvatarConfig,
} from '@cinemo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './jwt-payload';
import { AdminService } from '../admin/admin.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { Prisma } from '../generated/prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

const BCRYPT_ROUNDS = 10;

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  nickname: true,
  role: true,
  isTestAccount: true,
  avatarConfig: true,
  bio: true,
  profilePublic: true,
  tags: true,
} as const;

type AuthUserRow = {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  isTestAccount: boolean;
  avatarConfig?: unknown;
  bio?: string | null;
  profilePublic: boolean;
  tags?: string[];
};

function toAvatarConfig(value: unknown): AvatarConfig {
  if (value && typeof value === 'object') return value as AvatarConfig;
  return DEFAULT_AVATAR;
}

function toAuthUser(user: AuthUserRow) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
    isTestAccount: user.isTestAccount,
    avatarConfig: toAvatarConfig(user.avatarConfig),
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
  ) {}

  private async buildAuthResponse(user: AuthUserRow, message: string) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: toAuthUser(user),
      message,
    };
  }
  async register(dto: RegisterDto) {
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user)
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok)
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );

    if (user.role !== 'admin')
      await this.adminService.recordGuestLogin(user.id);
    return this.buildAuthResponse(user, '로그인 성공');
  }

  async getMe(userId: string) {
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

  async checkEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { available: false };
    return this.isAvailable({ email: normalized });
  }

  async checkNickname(nickname: string) {
    const normalized = nickname.trim();
    if (!normalized) return { available: false };
    return this.isAvailable({ nickname: normalized });
  }
  async updateAvatar(userId: string, dto: UpdateAvatarDto) {
    const avatarConfig = {
      hat: dto.hat,
      hatColor: dto.hatColor,
      skinColor: dto.skinColor,
      eyeStyle: dto.eyeStyle,
      blushColor: dto.blushColor,
      mouthStyle: dto.mouthStyle,
      outfit: dto.outfit,
    };
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarConfig: avatarConfig as unknown as Prisma.InputJsonValue },
      select: AUTH_USER_SELECT,
    });
    return toAuthUser(user);
  }
  async updateProfile(userId: string, dto: UpdateProfileDto) {
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
        avatarConfig: true,
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
      avatarConfig: toAvatarConfig(user.avatarConfig),
      bio: user.bio,
      tags: normalizeProfileTags(user.tags ?? []),
    };
  }
}
