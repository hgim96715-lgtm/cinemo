import { ApiProperty } from '@nestjs/swagger';
import { PostcardCommentAuthorResponseDto } from './postcard-comment-author-response.dto';

export class PostcardCommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  postcardId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ example: '이 장면의 분위기가 정말 좋았어요.' })
  text!: string;

  @ApiProperty({ type: PostcardCommentAuthorResponseDto })
  user!: PostcardCommentAuthorResponseDto;

  @ApiProperty({ type: () => [PostcardCommentResponseDto] })
  replies!: PostcardCommentResponseDto[];

  @ApiProperty({ example: 2 })
  reactionCount!: number;

  @ApiProperty({ example: false })
  reacted!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
