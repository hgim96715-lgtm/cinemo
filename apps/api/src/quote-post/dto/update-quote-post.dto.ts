import { PartialType } from '@nestjs/swagger';
import { CreateQuotePostDto } from './create-quote-post.dto';

export class UpdateQuotePostDto extends PartialType(CreateQuotePostDto) {}
