import { ApiProperty } from '@nestjs/swagger';

export class PostcardCommentAuthorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'cinemo_user' })
  nickname!: string;
}
