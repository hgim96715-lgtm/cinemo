import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserId } from '../auth/decorators/user-id.decorator';
import { CreatePostcardDto } from './dto/create-postcard.dto';
import { UpdatePostcardDto } from './dto/update-postcard.dto';
import { PostcardService } from './postcard.service';
import { OptionalUserId } from '../auth/decorators/optional-user-id.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TogglePostcardReactionDto } from './dto/toggle-postcard-reaction.dto';
import { CreatePostcardCommentDto } from './dto/create-postcard-comment.dto';
import { UpdatePostcardCommentDto } from './dto/update-postcard-comment.dto';
import { TogglePostcardCommentReactionDto } from './dto/toggle-postcard-comment-reaction.dto';
import { PostcardCommentResponseDto } from './dto/postcard-comment-response.dto';
import { PostcardDeleteResponseDto } from './dto/postcard-delete-response.dto';
import { PostcardItemResponseDto } from './dto/postcard-item-response.dto';
import { PostcardSummaryResponseDto } from './dto/postcard-summary-response.dto';
import { PostcardToggleBookmarkResponseDto } from './dto/postcard-toggle-bookmark-response.dto';
import { PostcardTogglePinnedResponseDto } from './dto/postcard-toggle-pinned-response.dto';
import { PostcardToggleReactionResponseDto } from './dto/postcard-toggle-reaction-response.dto';

@ApiTags('postcards')
@ApiBearerAuth()
@Controller('postcards')
export class PostcardController {
  constructor(private readonly postcardService: PostcardService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '공개 엽서 목록 조회' })
  @ApiOkResponse({ type: [PostcardItemResponseDto] })
  findPublic(
    @OptionalUserId() userId?: string,
  ): Promise<PostcardItemResponseDto[]> {
    return this.postcardService.findPublic(userId);
  }

  @Get('mine')
  @ApiOperation({ summary: '내가 만든 엽서 목록 조회' })
  @ApiOkResponse({ type: [PostcardSummaryResponseDto] })
  findMine(@UserId() userId: string): Promise<PostcardSummaryResponseDto[]> {
    return this.postcardService.findMine(userId);
  }

  @Get('bookmarked')
  @ApiOperation({ summary: '보관한 엽서 목록 조회' })
  @ApiOkResponse({ type: [PostcardSummaryResponseDto] })
  findBookmarked(
    @UserId() userId: string,
  ): Promise<PostcardSummaryResponseDto[]> {
    return this.postcardService.findBookmarked(userId);
  }

  @Post(':id/pin')
  @ApiOperation({ summary: '대표 엽서 고정·고정 해제' })
  @ApiCreatedResponse({ type: PostcardTogglePinnedResponseDto })
  togglePinned(
    @UserId() userId: string,
    @Param('id') postcardId: string,
  ): Promise<PostcardTogglePinnedResponseDto> {
    return this.postcardService.togglePinned(userId, postcardId);
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: '엽서 보관·보관 취소' })
  @ApiCreatedResponse({ type: PostcardToggleBookmarkResponseDto })
  toggleBookmark(
    @UserId() userId: string,
    @Param('id') postcardId: string,
  ): Promise<PostcardToggleBookmarkResponseDto> {
    return this.postcardService.toggleBookmark(userId, postcardId);
  }

  @Post(':id/reaction')
  @ApiOperation({ summary: '엽서 이모지 반응 추가·변경·취소' })
  toggleReaction(
    @UserId() userId: string,
    @Param('id') postcardId: string,
    @Body() dto: TogglePostcardReactionDto,
  ): Promise<PostcardToggleReactionResponseDto> {
    return this.postcardService.toggleReaction(userId, postcardId, dto.emoji);
  }

  @Post()
  @ApiOperation({ summary: '엽서 작성' })
  @ApiCreatedResponse({ type: PostcardSummaryResponseDto })
  create(
    @UserId() userId: string,
    @Body() dto: CreatePostcardDto,
  ): Promise<PostcardSummaryResponseDto> {
    return this.postcardService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '내 엽서 수정' })
  @ApiOkResponse({ type: PostcardSummaryResponseDto })
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePostcardDto,
  ): Promise<PostcardSummaryResponseDto> {
    return this.postcardService.update(userId, id, dto);
  }

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: '엽서 댓글·대댓글 조회' })
  @ApiOkResponse({ type: [PostcardCommentResponseDto] })
  findComments(
    @Param('id') postcardId: string,
    @OptionalUserId() userId?: string,
  ): Promise<PostcardCommentResponseDto[]> {
    return this.postcardService.findComments(postcardId, userId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '엽서 댓글 작성' })
  @ApiCreatedResponse({ type: PostcardCommentResponseDto })
  createComment(
    @UserId() userId: string,
    @Param('id') postcardId: string,
    @Body() dto: CreatePostcardCommentDto,
  ): Promise<PostcardCommentResponseDto> {
    return this.postcardService.createComment(userId, postcardId, dto);
  }

  @Patch(':postcardId/comments/:commentId')
  @ApiOperation({ summary: '내 댓글 수정' })
  @ApiOkResponse({ type: PostcardCommentResponseDto })
  updateComment(
    @UserId() userId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdatePostcardCommentDto,
  ): Promise<PostcardCommentResponseDto> {
    return this.postcardService.updateComment(userId, commentId, dto);
  }

  @Post(':postcardId/comments/:commentId/reaction')
  @ApiOperation({ summary: '댓글 이모지 반응 추가·취소' })
  @ApiCreatedResponse({ type: PostcardToggleReactionResponseDto })
  toggleCommentReaction(
    @UserId() userId: string,
    @Param('commentId') commentId: string,
    @Body() dto: TogglePostcardCommentReactionDto,
  ): Promise<PostcardToggleReactionResponseDto> {
    return this.postcardService.toggleCommentReaction(
      userId,
      commentId,
      dto.emoji,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '내 엽서 삭제' })
  @ApiOkResponse({ type: PostcardDeleteResponseDto })
  remove(
    @UserId() userId: string,
    @Param('id') id: string,
  ): Promise<PostcardDeleteResponseDto> {
    return this.postcardService.remove(userId, id);
  }

  @Delete(':postcardId/comments/:commentId')
  @ApiOperation({ summary: '내 댓글 삭제' })
  @ApiOkResponse({ type: PostcardDeleteResponseDto })
  removeComment(
    @UserId() userId: string,
    @Param('commentId') commentId: string,
  ): Promise<PostcardDeleteResponseDto> {
    return this.postcardService.removeComment(userId, commentId);
  }
}
