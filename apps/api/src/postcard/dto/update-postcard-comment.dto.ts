import { PartialType, PickType } from '@nestjs/swagger';
import { CreatePostcardCommentDto } from './create-postcard-comment.dto';

export class UpdatePostcardCommentDto extends PartialType(
  PickType(CreatePostcardCommentDto, ['text'] as const),
) {}
