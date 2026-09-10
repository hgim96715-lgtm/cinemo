import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TogglePostcardReactionDto {
  @ApiProperty({
    example: '❤️',
    description: '엽서에 추가할 이모지',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  emoji: string;
}
