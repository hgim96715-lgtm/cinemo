import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeOAuthCodeDto {
  @ApiProperty({ description: 'Google OAuth 일회용 code' })
  @IsString()
  @MinLength(20)
  code: string;
}
