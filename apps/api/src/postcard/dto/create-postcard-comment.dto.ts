import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePostcardCommentDto {
  @ApiProperty({
    example: '이 장면의 분위기가 정말 좋았어요.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;

  @ApiPropertyOptional({
    example: '01912345-aaaa-7bbb-8ccc-123456789012',
    nullable: true,
    description: '대댓글 작성 시 답글 대상 댓글 ID',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
