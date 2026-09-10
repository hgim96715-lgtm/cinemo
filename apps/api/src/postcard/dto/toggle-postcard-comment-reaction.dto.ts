import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TogglePostcardCommentReactionDto {
  @ApiProperty({
    example: '😊',
    description: '댓글에 추가할 이모지',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  emoji: string;
}
