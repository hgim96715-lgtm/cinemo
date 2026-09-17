import { ApiProperty } from '@nestjs/swagger';

export class MovieSearchItemDto {
  @ApiProperty({ example: 550 })
  id!: number;

  @ApiProperty({ example: '파이트 클럽' })
  title!: string;

  @ApiProperty({ example: 'Fight Club' })
  original_title!: string;

  @ApiProperty({ example: 'en' })
  original_language!: string;

  @ApiProperty({ example: '한 남자가 반복되는 일상에서 벗어나기 위해...' })
  overview!: string;

  @ApiProperty({ type: String, nullable: true, example: '/poster.jpg' })
  poster_path!: string | null;

  @ApiProperty({ example: '1999-10-15' })
  release_date!: string;
}

export class MovieSearchResponseDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 1 })
  total_pages!: number;

  @ApiProperty({ type: [MovieSearchItemDto] })
  results!: MovieSearchItemDto[];
}
