import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: '액세스 토큰 재발급에 사용하는 리프레시 토큰',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
