import { ApiProperty } from '@nestjs/swagger';

export class KmdbMovieResultDto {
  @ApiProperty({
    example: '어벤져스: 엔드게임 앙코르',
  })
  title!: string;

  @ApiProperty({
    example: '20260923',
    nullable: true,
  })
  releaseDate!: string | null;

  @ApiProperty({
    example: 'http://file.koreafilm.or.kr/thm/02/99/19/55/tn_DPF033876.jpg',
    nullable: true,
  })
  posterUrl!: string | null;

  @ApiProperty({
    example:
      'https://www.kmdb.or.kr/trailer/trailerPlayPop?pFileNm=MK065583_P01.mp4',
    nullable: true,
  })
  vodUrl!: string | null;

  @ApiProperty({
    example: '인피니티 워 이후 절반만 살아남은 지구 마지막 희망이 된 어벤져스...',
    nullable: true,
  })
  overview!: string | null;

  @ApiProperty({ example: '안소니 루소, 조 루소', nullable: true })
  director!: string | null;

  @ApiProperty({ type: [String], example: ['로버트 다우니 주니어'] })
  cast!: string[];

  @ApiProperty({ type: [String], example: ['액션', 'SF'] })
  genres!: string[];

  @ApiProperty({ example: '2019', nullable: true })
  productionYear!: string | null;

  @ApiProperty({ example: true })
  isReRelease!: boolean;
}

export class KmdbSearchResponseDto {
  @ApiProperty({
    example: 24,
  })
  totalCount!: number;

  @ApiProperty({
    type: [KmdbMovieResultDto],
  })
  results!: KmdbMovieResultDto[];
}
