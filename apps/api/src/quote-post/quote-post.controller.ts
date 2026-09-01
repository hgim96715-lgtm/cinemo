import {
  Controller,
  Get,
  Post,
  Body,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { QuotePostService } from './quote-post.service';
import { CreateQuotePostDto } from './dto/create-quote-post.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { UpdateQuotePostDto } from './dto/update-quote-post.dto';
import { OptionalUserId } from '../auth/decorators/optional-user-id.decorator';

@ApiTags('quote-posts')
@ApiBearerAuth()
@Controller('quote-posts')
export class QuotePostController {
  constructor(private readonly quotePostService: QuotePostService) {}

  @Public()
  @Get()
  list(
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
    @Query('cursor') cursor: string | undefined,
    @Query('q') search: string | undefined,
    @OptionalUserId() userId?: string,
  ) {
    return this.quotePostService.list(limit, userId, cursor, search);
  }

  @Get('saved')
  listSaved(
    @UserId() userId: string,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
    @Query('cursor') cursor: string | undefined,
    @Query('q') search: string | undefined,
  ) {
    return this.quotePostService.listSaved(userId, limit, cursor, search);
  }

  @Post()
  create(@UserId() userId: string, @Body() dto: CreateQuotePostDto) {
    return this.quotePostService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuotePostDto,
  ) {
    return this.quotePostService.update(userId, id, dto);
  }

  @Post(':id/save')
  save(@UserId() userId: string, @Param('id') id: string) {
    return this.quotePostService.save(userId, id);
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.quotePostService.remove(userId, id);
  }

  @Delete(':id/save')
  unsave(@UserId() userId: string, @Param('id') id: string) {
    return this.quotePostService.unsave(userId, id);
  }
}
