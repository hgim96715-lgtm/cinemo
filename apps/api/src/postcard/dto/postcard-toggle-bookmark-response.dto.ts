import { ApiProperty } from '@nestjs/swagger';

export class PostcardToggleBookmarkResponseDto {
  @ApiProperty({ example: true })
  bookmarked!: boolean;
}
