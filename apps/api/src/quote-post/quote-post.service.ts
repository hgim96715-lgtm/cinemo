import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuotePostDto } from './dto/create-quote-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { UpdateQuotePostDto } from './dto/update-quote-post.dto';

@Injectable()
export class QuotePostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

  private async findMovieIdsByTitle(search: string) {
    const movies = await this.prisma.moviePool.findMany({
      where: {
        title: { contains: search, mode: 'insensitive' },
      },
      select: { tmdbId: true },
      take: 120,
    });
    return movies.map((movie) => movie.tmdbId);
  }

  async list(limit = 24, userId?: string, cursor?: string, search?: string) {
    const take = Math.min(Math.max(limit, 1), 120);
    const normalizedSearch = search?.trim();
    const movieIds = normalizedSearch
      ? await this.findMovieIdsByTitle(normalizedSearch)
      : [];

    const rows = await this.prisma.quotePost.findMany({
      where: normalizedSearch
        ? {
            OR: [
              { text: { contains: normalizedSearch, mode: 'insensitive' } },
              {
                movieTitle: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                user: {
                  nickname: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              },
              ...(movieIds.length ? [{ tmdbId: { in: movieIds } }] : []),
            ],
          }
        : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { nickname: true } },
      },
    });

    const pageRows = rows.slice(0, take);

    const savedQuoteIds = userId
      ? new Set(
          (
            await this.prisma.quotePostBookmark.findMany({
              where: {
                userId,
                quotePostId: {
                  in: pageRows.map((quote) => quote.id),
                },
              },
              select: { quotePostId: true },
            })
          ).map((bookmark) => bookmark.quotePostId),
        )
      : new Set<string>();

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
      pageRows.map(async (quote) => ({
        id: quote.id,
        authorId: quote.userId,
        tmdbId: quote.tmdbId,
        text: quote.text,
        usePosterBackground: quote.usePosterBackground,
        nickname: quote.user.nickname,
        createdAt: quote.createdAt.toISOString(),
        isSaved: savedQuoteIds.has(quote.id),
        movie: await getMovie(quote.tmdbId),
      })),
    ).then((items) => ({
      items,
      nextCursor: rows.length > take ? pageRows.at(-1)?.id ?? null : null,
    }));
  }

  async listSaved(
    userId: string,
    limit = 24,
    cursor?: string,
    search?: string,
  ) {
    const take = Math.min(Math.max(limit, 1), 120);
    const normalizedSearch = search?.trim();
    const movieIds = normalizedSearch
      ? await this.findMovieIdsByTitle(normalizedSearch)
      : [];

    const bookmarks = await this.prisma.quotePostBookmark.findMany({
      where: {
        userId,
        ...(normalizedSearch
          ? {
              quotePost: {
                OR: [
                  {
                    text: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                  {
                    movieTitle: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                  {
                    user: {
                      nickname: {
                        contains: normalizedSearch,
                        mode: 'insensitive',
                      },
                    },
                  },
                  ...(movieIds.length ? [{ tmdbId: { in: movieIds } }] : []),
                ],
              },
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        quotePost: {
          include: {
            user: { select: { nickname: true } },
          },
        },
      },
    });

    const pageBookmarks = bookmarks.slice(0, take);

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
      pageBookmarks.map(async ({ quotePost }) => ({
        id: quotePost.id,
        authorId: quotePost.userId,
        tmdbId: quotePost.tmdbId,
        text: quotePost.text,
        usePosterBackground: quotePost.usePosterBackground,
        nickname: quotePost.user.nickname,
        createdAt: quotePost.createdAt.toISOString(),
        isSaved: true,
        movie: await getMovie(quotePost.tmdbId),
      })),
    ).then((items) => ({
      items,
      nextCursor:
        bookmarks.length > take ? pageBookmarks.at(-1)?.id ?? null : null,
    }));
  }

  async create(userId: string, dto: CreateQuotePostDto) {
    const text = dto.text.trim();

    const movie = await this.tmdbService.getMovieCached(dto.tmdbId);

    const quote = await this.prisma.quotePost.create({
      data: {
        userId,
        tmdbId: dto.tmdbId,
        movieTitle: movie.title,
        text,
        usePosterBackground: dto.usePosterBackground ?? true,
      },
      include: {
        user: { select: { nickname: true } },
      },
    });

    return {
      id: quote.id,
      authorId: quote.userId,
      tmdbId: quote.tmdbId,
      text: quote.text,
      isSaved: false,
      usePosterBackground: quote.usePosterBackground,
      nickname: quote.user.nickname,
      createdAt: quote.createdAt.toISOString(),
      movie,
    };
  }

  async update(userId: string, id: string, dto: UpdateQuotePostDto) {
    const data: {
      tmdbId?: number;
      movieTitle?: string;
      text?: string;
      usePosterBackground?: boolean;
    } = {};
    let movie: Awaited<ReturnType<TmdbService['getMovieCached']>> | null = null;
    if (dto.tmdbId !== undefined) {
      movie = await this.tmdbService.getMovieCached(dto.tmdbId);
      data.tmdbId = dto.tmdbId;
      data.movieTitle = movie.title;
    }
    if (dto.text !== undefined) {
      const text = dto.text.trim();
      if (!text) throw new BadRequestException('명대사를 입력해야 합니다.');
      data.text = text;
    }
    if (dto.usePosterBackground !== undefined) {
      data.usePosterBackground = dto.usePosterBackground;
    }
    const result = await this.prisma.quotePost.updateMany({
      where: { id, userId },
      data,
    });
    if (result.count === 0) {
      throw new NotFoundException('수정할 명대사를 찾을 수 없습니다.');
    }
    const quote = await this.prisma.quotePost.findFirst({
      where: { id, userId },
      include: { user: { select: { nickname: true } } },
    });

    if (!quote)
      throw new NotFoundException('수정한 명대사를 찾을 수 없습니다.');

    return {
      id: quote.id,
      authorId: quote.userId,
      tmdbId: quote.tmdbId,
      text: quote.text,
      isSaved: false,
      usePosterBackground: quote.usePosterBackground,
      nickname: quote.user.nickname,
      createdAt: quote.createdAt.toISOString(),
      movie:
        movie ?? (await this.tmdbService.getMovieCached(quote.tmdbId)),
    };
  }

  async save(userId: string, quotePostId: string) {
    const quote = await this.prisma.quotePost.findUnique({
      where: { id: quotePostId },
      select: { id: true },
    });

    if (!quote)
      throw new NotFoundException('저장할 명대사를 찾을 수 없습니다.');

    await this.prisma.quotePostBookmark.upsert({
      where: {
        userId_quotePostId: { userId, quotePostId },
      },
      update: {},
      create: { userId, quotePostId },
    });
    return { saved: true };
  }

  async unsave(userId: string, quotePostId: string) {
    await this.prisma.quotePostBookmark.deleteMany({
      where: { userId, quotePostId },
    });
    return { saved: false };
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.quotePost.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0)
      throw new NotFoundException('삭제할 명대사를 찾을 수 없습니다.');
    return { deleted: true };
  }
}
