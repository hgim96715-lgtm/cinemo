import { ApiProperty } from '@nestjs/swagger';

export class UserMovieCountsResponseDto {
  @ApiProperty({ example: 12 })
  wish!: number;

  @ApiProperty({ example: 8 })
  watched!: number;
}
