import { ApiProperty } from '@nestjs/swagger';

export class PostcardTogglePinnedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: true })
  isPinned!: boolean;
}
