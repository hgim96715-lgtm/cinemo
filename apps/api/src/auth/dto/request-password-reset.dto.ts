import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: '비밀번호 재설정 링크를 받을 이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
