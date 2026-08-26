import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewPostDto } from './dto/create-review-post.dto';
import { UpdateReviewPostDto } from './dto/update-review-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { ReviewPostItem } from '@cinemo/shared';
import { kstTodayRange } from '../lib/date-kst';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class ReviewPostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly adminService: AdminService,
  ) {}

  async list(limit = 40, userId?: string): Promise<ReviewPostItem[]> {
    const take = Math.min(Math.max(limit, 1), 120);
    const rows = await this.prisma.reviewPost.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { nickname: true } },
        _count: { select: { reviewPostLikes: true } },
        reviewPostLikes: userId
          ? { where: { userId }, select: { id: true }, take: 1 }
          : false,
      },
    });
    const movieCache = new Map<
      number,
      ReturnType<TmdbService['getMovieCached']>
    >();
    const getMovie = (tmdbId: number) => {
      const cached = movieCache.get(tmdbId);
      if (cached) return cached;
      const request = this.tmdbService.getMovieCached(tmdbId);
      movieCache.set(tmdbId, request);
      return request;
    };

    return Promise.all(
      rows.map(async (post) => ({
        id: post.id,
        tmdbId: post.tmdbId,
        body: post.body,
        rating: post.rating,
        createdAt: post.createdAt.toISOString(),
        nickname: post.user.nickname,
        movie: await getMovie(post.tmdbId),
        likeCount: post._count.reviewPostLikes,
        likedByMe: userId ? post.reviewPostLikes.length > 0 : false,
      })),
    );
  }

  async create(
    userId: string,
    dto: CreateReviewPostDto,
  ): Promise<ReviewPostItem> {
    if (Math.round(dto.rating * 2) !== dto.rating * 2) {
      throw new BadRequestException('별점은 0.5단위로 입력해주세요.');
    }
    const { start, end } = kstTodayRange();
    const postedToday = await this.prisma.reviewPost.findFirst({
      where: { userId, createdAt: { gte: start, lt: end } },
    });
    if (postedToday)
      throw new BadRequestException('오늘 한 번만 후기할 수 있습니다.');

    await this.tmdbService.getMovieCached(dto.tmdbId);

    const post = await this.prisma.reviewPost.create({
      data: {
        userId,
        tmdbId: dto.tmdbId,
        body: dto.body.trim(),
        rating: dto.rating,
      },
      include: {
        user: { select: { nickname: true } },
        _count: { select: { reviewPostLikes: true } },
      },
    });
    const movie = await this.tmdbService.getMovieCached(post.tmdbId);
    void this.adminService.countIncrement('reviews', new Date(), userId);
    return {
      id: post.id,
      tmdbId: post.tmdbId,
      body: post.body,
      rating: post.rating,
      createdAt: post.createdAt.toISOString(),
      nickname: post.user.nickname,
      movie,
      likeCount: post._count.reviewPostLikes,
      likedByMe: false,
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateReviewPostDto,
  ): Promise<ReviewPostItem> {
    if (dto.rating != null && Math.round(dto.rating * 2) !== dto.rating * 2) {
      throw new BadRequestException('별점은 0.5단위로 입력해주세요.');
    }
    if (dto.body == null && dto.rating == null) {
      throw new BadRequestException('수정할 내용이 없습니다.');
    }
    const existing = await this.prisma.reviewPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('존재하지 않는 후기입니다.');
    if (existing.userId !== userId) {
      throw new ForbiddenException('내 후기만 수정할 수 있습니다.');
    }
    const post = await this.prisma.reviewPost.update({
      where: { id },
      data: {
        ...(dto.body != null ? { body: dto.body.trim() } : {}),
        ...(dto.rating != null ? { rating: dto.rating } : {}),
      },
      include: {
        user: { select: { nickname: true } },
        _count: { select: { reviewPostLikes: true } },
      },
    });
    const movie = await this.tmdbService.getMovieCached(post.tmdbId);
    return {
      id: post.id,
      tmdbId: post.tmdbId,
      body: post.body,
      rating: post.rating,
      createdAt: post.createdAt.toISOString(),
      nickname: post.user.nickname,
      movie,
      likeCount: post._count.reviewPostLikes,
      likedByMe: false,
    };
  }

  async toggleLike(
    userId: string,
    postId: string,
  ): Promise<{ likeCount: number; likedByMe: boolean }> {
    const post = await this.prisma.reviewPost.findUnique({
      where: { id: postId },
      include: { _count: { select: { reviewPostLikes: true } } },
    });
    if (!post) throw new NotFoundException('존재하지 않는 후기입니다.');
    if (post.userId === userId) {
      throw new BadRequestException('내 후기에는 좋아요할 수 없어요.');
    }
    const existing = await this.prisma.reviewPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await this.prisma.reviewPostLike.delete({ where: { id: existing.id } });
      return {
        likeCount: post._count.reviewPostLikes - 1,
        likedByMe: false,
      };
    }
    await this.prisma.reviewPostLike.create({ data: { postId, userId } });
    return { likeCount: post._count.reviewPostLikes + 1, likedByMe: true };
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.reviewPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('존재하지 않는 후기입니다.');
    if (existing.userId !== userId) {
      throw new ForbiddenException('내 후기만 삭제할 수 있습니다.');
    }
    await this.prisma.reviewPost.delete({ where: { id } });
  }
}
