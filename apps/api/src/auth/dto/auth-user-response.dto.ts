import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'cinemo-user' })
  nickname!: string;

  @ApiProperty({ enum: ['user', 'admin'], example: 'user' })
  role!: 'user' | 'admin';

  @ApiPropertyOptional({
    enum: ['email', 'google', 'naver', 'kakao', 'apple'],
    nullable: true,
    example: 'email',
  })
  lastLoginProvider!: 'email' | 'google' | 'naver' | 'kakao' | 'apple' | null;

  @ApiProperty({ example: false })
  isTestAccount!: boolean;

  @ApiProperty({ type: String, nullable: true, example: '영화를 좋아합니다.' })
  bio!: string | null;

  @ApiProperty({ example: true })
  profilePublic!: boolean;

  @ApiProperty({ type: [String], example: ['SF', '드라마'] })
  tags!: string[];
}
