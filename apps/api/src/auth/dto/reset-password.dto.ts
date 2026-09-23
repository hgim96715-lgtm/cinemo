import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: '비밀번호 재설정 토큰' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '새 비밀번호', example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
