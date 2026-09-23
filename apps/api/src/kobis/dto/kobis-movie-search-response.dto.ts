import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KobisMovieListDirectorDto {
  @ApiProperty({ example: '봉준호' })
  peopleNm!: string;

  @ApiPropertyOptional({ example: 'Bong Joon-ho' })
  peopleNmEn?: string;
}

export class KobisMovieListItemDto {
  @ApiProperty({ example: '20201234' })
  movieCd!: string;

  @ApiProperty({ example: '기생충' })
  movieNm!: string;

  @ApiPropertyOptional({ example: 'PARASITE' })
  movieNmEn?: string;

  @ApiPropertyOptional({ example: '2019' })
  prdtYear?: string;

  @ApiPropertyOptional({ example: '2019-05-30' })
  openDt?: string;

  @ApiPropertyOptional({ example: '개봉' })
  prdtStatNm?: string;

  @ApiPropertyOptional({ example: '장편' })
  typeNm?: string;

  @ApiPropertyOptional({ example: '한국' })
  nationAlt?: string;

  @ApiPropertyOptional({ example: '드라마' })
  genreAlt?: string;

  @ApiPropertyOptional({ example: 'KOR' })
  repNationCd?: string;

  @ApiPropertyOptional({ example: '드라마' })
  repGenreNm?: string;

  @ApiProperty({ type: [KobisMovieListDirectorDto] })
  directors!: KobisMovieListDirectorDto[];
}

export class KobisMovieListResultDto {
  @ApiProperty({ example: '1' })
  totCnt!: string;

  @ApiProperty({ example: '영화진흥위원회' })
  source!: string;

  @ApiProperty({ type: [KobisMovieListItemDto] })
  movieList!: KobisMovieListItemDto[];
}

export class KobisMovieSearchResponseDto {
  @ApiProperty({ type: KobisMovieListResultDto })
  movieListResult!: KobisMovieListResultDto;
}
