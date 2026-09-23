import { ApiProperty } from '@nestjs/swagger';

export class PostcardDeleteResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;

  @ApiProperty({ format: 'uuid' })
  id!: string;
}
