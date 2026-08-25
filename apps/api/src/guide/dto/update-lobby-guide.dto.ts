import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateLobbyGuideStepDto {
  @ApiProperty({ example: 'gacha' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(32)
  id!: string;

  @ApiProperty({ example: 'GACHA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  kicker!: string;

  @ApiProperty({ example: '뽑기방에서 한 편' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  title!: string;

  @ApiProperty({ example: '장르·국적·추천 머신으로 오늘의 영화를 뽑아요.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  body!: string;
}

export class UpdateLobbyGuideDto {
  @ApiProperty({
    type: [UpdateLobbyGuideStepDto],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UpdateLobbyGuideStepDto)
  steps!: UpdateLobbyGuideStepDto[];
}
