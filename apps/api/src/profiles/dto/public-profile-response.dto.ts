import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicProfileResponseDto {
  @ApiProperty({
    description: '프로필 닉네임',
    example: 'cinemo_user',
  })
  nickname!: string;

  @ApiProperty({
    description: '프로필 공개 여부',
    example: true,
  })
  profilePublic!: boolean;

  @ApiPropertyOptional({
    description: '프로필 소개',
    nullable: true,
    example: '영화를 좋아합니다.',
  })
  bio?: string | null;

  @ApiPropertyOptional({
    description: '관심 태그',
    type: [String],
    example: ['스릴러', '액션'],
  })
  tags?: string[];
}
