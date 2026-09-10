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
  @ApiProperty({ example: 'upcoming' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(32)
  id!: string;

  @ApiProperty({ example: 'SCREEN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  kicker!: string;

  @ApiProperty({ example: '스크린에서 만날 영화를 저장해요' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  title!: string;

  @ApiProperty({
    example: '개봉 예정작 중 마음에 드는 영화는 ‘보고 싶어요’로 저장해요.',
  })
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
