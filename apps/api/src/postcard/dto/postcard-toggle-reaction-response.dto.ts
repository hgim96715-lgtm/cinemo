import { ApiProperty } from '@nestjs/swagger';

export class PostcardToggleReactionResponseDto {
  @ApiProperty({ example: '❤️' })
  emoji!: string;

  @ApiProperty({ example: true })
  reacted!: boolean;
}
