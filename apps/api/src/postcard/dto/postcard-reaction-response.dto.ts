import { ApiProperty } from '@nestjs/swagger';

export class PostcardReactionResponseDto {
  @ApiProperty({ example: '❤️' })
  emoji!: string;

  @ApiProperty({ example: 3 })
  count!: number;

  @ApiProperty({ example: false })
  reacted!: boolean;
}
