import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  PROFILE_BIO_MAX,
  PROFILE_TAG_LIMIT,
  PROFILE_TAG_MAX_LEN,
} from '@cinemo/shared';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  nickname?: string;

  /** null이면 bio 비움 · 생략하면 유지 */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(PROFILE_BIO_MAX)
  bio?: string | null;

  @IsOptional()
  @IsBoolean()
  profilePublic?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PROFILE_TAG_LIMIT)
  @IsString({ each: true })
  @MaxLength(PROFILE_TAG_MAX_LEN, { each: true })
  tags?: string[];
}
