import { ApiProperty } from '@nestjs/swagger';

export class MoviePoolBackfillResponseDto {
  @ApiProperty({ example: 'movie_pool 백필을 시작했습니다.' })
  message!: string;

  @ApiProperty({ example: 5 })
  pages!: number;
}
