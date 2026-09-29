import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyPasswordResetCodeDto {
  @ApiProperty({
    description: '비밀번호 재설정 요청 이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '이메일로 받은 6자리 인증 코드',
    example: '123456',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: '인증 코드는 6자리 숫자여야 합니다.',
  })
  code: string;
}
