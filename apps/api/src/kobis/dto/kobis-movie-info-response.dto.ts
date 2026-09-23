import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KobisNationDto {
  @ApiProperty({ example: '한국' })
  nationNm!: string;
}

export class KobisGenreDto {
  @ApiProperty({ example: '드라마' })
  genreNm!: string;
}

export class KobisDirectorDto {
  @ApiProperty({ example: '봉준호' })
  peopleNm!: string;

  @ApiPropertyOptional({ example: 'Bong Joon-ho' })
  peopleNmEn?: string;
}

export class KobisActorDto {
  @ApiProperty({ example: '송강호' })
  peopleNm!: string;

  @ApiPropertyOptional({ example: 'Song Kang-ho' })
  peopleNmEn?: string;

  @ApiPropertyOptional({ example: '기택' })
  cast?: string;

  @ApiPropertyOptional({ example: 'Ki-taek' })
  castEn?: string;
}

export class KobisShowTypeDto {
  @ApiProperty({ example: '상영형태' })
  showTypeGroupNm!: string;

  @ApiProperty({ example: '2D' })
  showTypeNm!: string;
}

export class KobisAuditDto {
  @ApiProperty({ example: '2020-MF00001' })
  auditNo!: string;

  @ApiProperty({ example: '15세이상관람가' })
  watchGradeNm!: string;
}

export class KobisStaffDto {
  @ApiProperty({ example: '홍길동' })
  peopleNm!: string;

  @ApiPropertyOptional({ example: 'Hong Gil-dong' })
  peopleNmEn?: string;

  @ApiProperty({ example: '각본' })
  staffRoleNm!: string;
}

export class KobisMovieInfoDto {
  @ApiProperty({ example: '20201234' })
  movieCd!: string;

  @ApiProperty({ example: '기생충' })
  movieNm!: string;

  @ApiPropertyOptional({ example: 'PARASITE' })
  movieNmEn?: string;

  @ApiPropertyOptional({ example: '기생충' })
  movieNmOg?: string;

  @ApiPropertyOptional({ example: '132' })
  showTm?: string;

  @ApiPropertyOptional({ example: '2019' })
  prdtYear?: string;

  @ApiPropertyOptional({ example: '2019-05-30' })
  openDt?: string;

  @ApiPropertyOptional({ example: '개봉' })
  prdtStatNm?: string;

  @ApiPropertyOptional({ example: '장편' })
  typeNm?: string;

  @ApiProperty({ type: [KobisNationDto] })
  nations!: KobisNationDto[];

  @ApiProperty({ type: [KobisGenreDto] })
  genres!: KobisGenreDto[];

  @ApiProperty({ type: [KobisDirectorDto] })
  directors!: KobisDirectorDto[];

  @ApiProperty({ type: [KobisActorDto] })
  actors!: KobisActorDto[];

  @ApiProperty({ type: [KobisShowTypeDto] })
  showTypes!: KobisShowTypeDto[];

  @ApiProperty({ type: [KobisAuditDto] })
  audits!: KobisAuditDto[];

  @ApiProperty({ type: [KobisStaffDto] })
  staffs!: KobisStaffDto[];
}

export class KobisMovieInfoResultDto {
  @ApiProperty({ type: KobisMovieInfoDto })
  movieInfo!: KobisMovieInfoDto;
}

export class KobisMovieInfoResponseDto {
  @ApiProperty({ type: KobisMovieInfoResultDto })
  movieInfoResult!: KobisMovieInfoResultDto;
}
