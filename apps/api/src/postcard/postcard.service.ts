import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostcardDto } from './dto/create-postcard.dto';
import { UpdatePostcardDto } from './dto/update-postcard.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostcardCommentDto } from './dto/create-postcard-comment.dto';
import { UpdatePostcardCommentDto } from './dto/update-postcard-comment.dto';
import { PostcardCommentResponseDto } from './dto/postcard-comment-response.dto';
import { PostcardDeleteResponseDto } from './dto/postcard-delete-response.dto';
import { PostcardItemResponseDto } from './dto/postcard-item-response.dto';
import { PostcardSummaryResponseDto } from './dto/postcard-summary-response.dto';
import { PostcardToggleBookmarkResponseDto } from './dto/postcard-toggle-bookmark-response.dto';
import { PostcardTogglePinnedResponseDto } from './dto/postcard-toggle-pinned-response.dto';
import { PostcardToggleReactionResponseDto } from './dto/postcard-toggle-reaction-response.dto';

@Injectable()
export class PostcardService {
  constructor(private readonly prisma: PrismaService) {}

  private toPostcardSummaryResponse(postcard: {
    id: string;
    tmdbId: number;
    movieTitle: string | null;
    originalText: string | null;
    text: string;
    posterPath: string | null;
    isPublic: boolean;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      nickname: string;
    };
  }): PostcardSummaryResponseDto {
    return {
      id: postcard.id,
      tmdbId: postcard.tmdbId,
      nickname: postcard.user.nickname,
      movieTitle: postcard.movieTitle,
      originalText: postcard.originalText,
      text: postcard.text,
      posterPath: postcard.posterPath,
      isPublic: postcard.isPublic,
      isPinned: postcard.isPinned,
      createdAt: postcard.createdAt.toISOString(),
      updatedAt: postcard.updatedAt.toISOString(),
    };
  }

  async findPublic(userId?: string): Promise<PostcardItemResponseDto[]> {
    const postcards = await this.prisma.postcard.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        tmdbId: true,
        movieTitle: true,
        originalText: true,
        text: true,
        posterPath: true,
        isPublic: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            nickname: true,
          },
        },
        postcardReactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });

    const bookmarkedIds = userId
      ? new Set(
          (
            await this.prisma.postcardBookmark.findMany({
              where: {
                userId,
                postcardId: {
                  in: postcards.map((postcard) => postcard.id),
                },
              },
              select: {
                postcardId: true,
              },
            })
          ).map((bookmark) => bookmark.postcardId),
        )
      : new Set<string>();

    return postcards.map((postcard) => {
      const reactionMap = new Map<
        string,
        { count: number; reacted: boolean }
      >();

      for (const reaction of postcard.postcardReactions) {
        const current = reactionMap.get(reaction.emoji) ?? {
          count: 0,
          reacted: false,
        };
        reactionMap.set(reaction.emoji, {
          count: current.count + 1,
          reacted: current.reacted || reaction.userId === userId,
        });
      }

      return {
        id: postcard.id,
        tmdbId: postcard.tmdbId,
        movieTitle: postcard.movieTitle,
        originalText: postcard.originalText,
        text: postcard.text,
        posterPath: postcard.posterPath,
        isPublic: postcard.isPublic,
        nickname: postcard.user.nickname,
        isOwner: postcard.userId === userId,
        isBookmarked: bookmarkedIds.has(postcard.id),
        isPinned: postcard.isPinned,
        reactionCounts: Array.from(reactionMap, ([emoji, value]) => ({
          emoji,
          count: value.count,
          reacted: value.reacted,
        })),
        createdAt: postcard.createdAt.toISOString(),
        updatedAt: postcard.updatedAt.toISOString(),
      };
    });
  }

  async findMine(userId: string): Promise<PostcardSummaryResponseDto[]> {
    const postcards = await this.prisma.postcard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tmdbId: true,
        movieTitle: true,
        originalText: true,
        text: true,
        posterPath: true,
        isPublic: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

    return postcards.map((postcard) => this.toPostcardSummaryResponse(postcard));
  }

  async findBookmarked(userId: string): Promise<PostcardSummaryResponseDto[]> {
    const bookmarks = await this.prisma.postcardBookmark.findMany({
      where: { userId, postcard: { isPublic: true } },
      orderBy: { createdAt: 'desc' },
      select: {
        postcard: {
          select: {
            id: true,
            tmdbId: true,
            movieTitle: true,
            originalText: true,
            text: true,
            posterPath: true,
            isPublic: true,
            isPinned: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    });
    return bookmarks.map(({ postcard }) =>
      this.toPostcardSummaryResponse(postcard),
    );
  }

  async togglePinned(
    userId: string,
    postcardId: string,
  ): Promise<PostcardTogglePinnedResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findUnique({
        where: { id: postcardId },
        select: {
          id: true,
          userId: true,
          isPinned: true,
        },
      });
      if (!postcard) {
        throw new NotFoundException('엽서를 찾을 수 없습니다.');
      }
      if (postcard.userId !== userId) {
        throw new ForbiddenException(
          '내 엽서만 대표 엽서로 고정할 수 있습니다.',
        );
      }
      if (!postcard.isPinned) {
        const pinnedCount = await tx.postcard.count({
          where: {
            userId,
            isPinned: true,
          },
        });

        if (pinnedCount >= 3) {
          throw new BadRequestException(
            '대표 엽서는 최대 3개까지 고정할 수 있습니다.',
          );
        }
      }

      return tx.postcard.update({
        where: { id: postcardId },
        data: {
          isPinned: !postcard.isPinned,
        },
        select: {
          id: true,
          isPinned: true,
        },
      });
    });
  }

  async toggleBookmark(
    userId: string,
    postcardId: string,
  ): Promise<PostcardToggleBookmarkResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findUnique({
        where: { id: postcardId },
        select: { id: true, isPublic: true },
      });
      if (!postcard || !postcard.isPublic) {
        throw new NotFoundException('공개된 엽서를 찾을 수 없습니다.');
      }
      const bookmark = await tx.postcardBookmark.findUnique({
        where: {
          postcardId_userId: {
            postcardId,
            userId,
          },
        },
      });
      if (bookmark) {
        await tx.postcardBookmark.delete({
          where: { id: bookmark.id },
        });
        return { bookmarked: false };
      }
      await tx.postcardBookmark.create({
        data: {
          postcardId,
          userId,
        },
      });
      return { bookmarked: true };
    });
  }

  async toggleReaction(
    userId: string,
    postcardId: string,
    emoji: string,
  ): Promise<PostcardToggleReactionResponseDto> {
    const normalizedEmoji = emoji.trim();
    if (!normalizedEmoji) {
      throw new BadRequestException('이모지를 입력해야 합니다.');
    }
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findUnique({
        where: { id: postcardId },
        select: { id: true, isPublic: true },
      });
      if (!postcard || !postcard.isPublic) {
        throw new NotFoundException('공개된 엽서를 찾을 수 없습니다.');
      }
      const existingReaction = await tx.postcardReaction.findFirst({
        where: {
          postcardId,
          userId,
        },
      });

      if (!existingReaction) {
        await tx.postcardReaction.create({
          data: {
            postcardId,
            userId,
            emoji: normalizedEmoji,
          },
        });

        return {
          emoji: normalizedEmoji,
          reacted: true,
        };
      }
      if (existingReaction.emoji === normalizedEmoji) {
        await tx.postcardReaction.delete({
          where: { id: existingReaction.id },
        });

        return {
          emoji: normalizedEmoji,
          reacted: false,
        };
      }
      const updatedReaction = await tx.postcardReaction.update({
        where: { id: existingReaction.id },
        data: {
          emoji: normalizedEmoji,
        },
      });

      return {
        emoji: updatedReaction.emoji,
        reacted: true,
      };
    });
  }

  async create(
    userId: string,
    dto: CreatePostcardDto,
  ): Promise<PostcardSummaryResponseDto> {
    const postcard = await this.prisma.postcard.create({
      data: {
        userId,
        tmdbId: dto.tmdbId,
        movieTitle: dto.movieTitle?.trim() || null,
        originalText: dto.originalText?.trim() || null,
        text: dto.text.trim(),
        posterPath: dto.posterPath?.trim() || null,
        isPublic: dto.isPublic ?? true,
      },
      select: {
        id: true,
        tmdbId: true,
        movieTitle: true,
        originalText: true,
        text: true,
        posterPath: true,
        isPublic: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

    return this.toPostcardSummaryResponse(postcard);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePostcardDto,
  ): Promise<PostcardSummaryResponseDto> {
    const postcard = await this.prisma.postcard.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!postcard) {
      throw new NotFoundException('엽서를 찾을 수 없습니다.');
    }
    if (postcard.userId !== userId) {
      throw new ForbiddenException('본인이 만든 엽서만 수정 가능합니다.');
    }

    const data = {
      ...(dto.movieTitle !== undefined && {
        movieTitle: dto.movieTitle?.trim() || null,
      }),
      ...(dto.text !== undefined && {
        text: dto.text.trim(),
      }),
      ...(dto.originalText !== undefined && {
        originalText: dto.originalText?.trim() || null,
      }),
      ...(dto.posterPath !== undefined && {
        posterPath: dto.posterPath?.trim() || null,
      }),
      ...(dto.isPublic !== undefined && {
        isPublic: dto.isPublic,
      }),
    };

    const updatedPostcard = await this.prisma.postcard.update({
      where: { id },
      data,
      select: {
        id: true,
        tmdbId: true,
        movieTitle: true,
        originalText: true,
        text: true,
        posterPath: true,
        isPublic: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

    return this.toPostcardSummaryResponse(updatedPostcard);
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<PostcardDeleteResponseDto> {
    const postcard = await this.prisma.postcard.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!postcard) {
      throw new NotFoundException('엽서를 찾을 수 없습니다.');
    }

    if (postcard.userId !== userId) {
      throw new ForbiddenException('본인이 만든 엽서만 삭제할 수 있습니다.');
    }

    await this.prisma.postcard.delete({
      where: { id },
    });

    return {
      deleted: true,
      id,
    };
  }

  async findComments(
    postcardId: string,
    userId?: string,
  ): Promise<PostcardCommentResponseDto[]> {
    const postcard = await this.prisma.postcard.findUnique({
      where: { id: postcardId },
      select: { id: true, isPublic: true },
    });

    if (!postcard || !postcard.isPublic) {
      throw new NotFoundException('공개된 엽서를 찾을 수 없습니다.');
    }

    const comments = await this.prisma.postcardComment.findMany({
      where: {
        postcardId,
        parentId: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        reactions: {
          select: { userId: true },
        },
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
            reactions: {
              select: { userId: true },
            },
          },
        },
      },
    });

    const mapComment = (comment: (typeof comments)[number]) => {
      const { reactions, replies, ...commentData } = comment;

      return {
        id: commentData.id,
        postcardId: commentData.postcardId,
        userId: commentData.userId,
        parentId: commentData.parentId,
        text: commentData.text,
        user: commentData.user,
        reactionCount: reactions.length,
        reacted: Boolean(
          userId && reactions.some((reaction) => reaction.userId === userId),
        ),
        createdAt: commentData.createdAt.toISOString(),
        updatedAt: commentData.updatedAt.toISOString(),
        replies: replies.map((reply) => {
          const { reactions: replyReactions, ...replyData } = reply;

          return {
            id: replyData.id,
            postcardId: replyData.postcardId,
            userId: replyData.userId,
            parentId: replyData.parentId,
            text: replyData.text,
            user: replyData.user,
            reactionCount: replyReactions.length,
            reacted: Boolean(
              userId && replyReactions.some((reaction) => reaction.userId === userId),
            ),
            createdAt: replyData.createdAt.toISOString(),
            updatedAt: replyData.updatedAt.toISOString(),
            replies: [],
          };
        }),
      };
    };

    return comments.map(mapComment);
  }

  async createComment(
    userId: string,
    postcardId: string,
    dto: CreatePostcardCommentDto,
  ): Promise<PostcardCommentResponseDto> {
    const text = dto.text.trim();

    if (!text) {
      throw new BadRequestException('댓글 내용을 입력해야 합니다.');
    }

    const postcard = await this.prisma.postcard.findUnique({
      where: { id: postcardId },
      select: { id: true, isPublic: true },
    });

    if (!postcard || !postcard.isPublic) {
      throw new NotFoundException('공개된 엽서를 찾을 수 없습니다.');
    }

    if (dto.parentId) {
      const parentComment = await this.prisma.postcardComment.findUnique({
        where: { id: dto.parentId },
        select: { postcardId: true },
      });

      if (!parentComment || parentComment.postcardId !== postcardId) {
        throw new NotFoundException('답글 대상 댓글을 찾을 수 없습니다.');
      }
    }

    const comment = await this.prisma.postcardComment.create({
      data: {
        postcardId,
        userId,
        parentId: dto.parentId ?? null,
        text,
      },
      select: {
        id: true,
        postcardId: true,
        userId: true,
        parentId: true,
        text: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return {
      id: comment.id,
      postcardId: comment.postcardId,
      userId: comment.userId,
      parentId: comment.parentId,
      text: comment.text,
      user: comment.user,
      reactionCount: 0,
      reacted: false,
      replies: [],
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdatePostcardCommentDto,
  ): Promise<PostcardCommentResponseDto> {
    const text = dto.text?.trim();
    if (!text) {
      throw new BadRequestException('댓글 내용을 입력해야 합니다.');
    }
    const comment = await this.prisma.postcardComment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 댓글만 수정할 수 있습니다.');
    }
    const updatedComment = await this.prisma.postcardComment.update({
      where: { id: commentId },
      data: {
        text,
      },
      select: {
        id: true,
        postcardId: true,
        userId: true,
        parentId: true,
        text: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        reactions: {
          select: {
            userId: true,
          },
        },
      },
    });

    return {
      id: updatedComment.id,
      postcardId: updatedComment.postcardId,
      userId: updatedComment.userId,
      parentId: updatedComment.parentId,
      text: updatedComment.text,
      user: updatedComment.user,
      replies: [],
      reactionCount: updatedComment.reactions.length,
      reacted: updatedComment.reactions.some(
        (reaction) => reaction.userId === userId,
      ),
      createdAt: updatedComment.createdAt.toISOString(),
      updatedAt: updatedComment.updatedAt.toISOString(),
    };
  }
  async removeComment(
    userId: string,
    commentId: string,
  ): Promise<PostcardDeleteResponseDto> {
    const comment = await this.prisma.postcardComment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 댓글만 삭제할 수 있습니다.');
    }

    await this.prisma.postcardComment.delete({
      where: { id: commentId },
    });

    return {
      deleted: true,
      id: commentId,
    };
  }
  async toggleCommentReaction(
    userId: string,
    commentId: string,
    emoji: string,
  ): Promise<PostcardToggleReactionResponseDto> {
    const normalizedEmoji = emoji.trim();

    if (!normalizedEmoji) {
      throw new BadRequestException('이모지를 입력해야 합니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.postcardComment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          postcard: {
            select: {
              isPublic: true,
            },
          },
        },
      });
      if (!comment || !comment.postcard.isPublic) {
        throw new NotFoundException('공개된 엽서의 댓글을 찾을 수 없습니다.');
      }
      const reaction = await tx.postcardCommentReaction.findUnique({
        where: {
          commentId_userId_emoji: {
            commentId,
            userId,
            emoji: normalizedEmoji,
          },
        },
      });
      if (reaction) {
        await tx.postcardCommentReaction.delete({
          where: { id: reaction.id },
        });
        return { emoji: normalizedEmoji, reacted: false };
      }
      await tx.postcardCommentReaction.create({
        data: {
          commentId,
          userId,
          emoji: normalizedEmoji,
        },
      });

      return {
        emoji: normalizedEmoji,
        reacted: true,
      };
    });
  }
}
