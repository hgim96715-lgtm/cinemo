import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { MoviePool } from '../generated/prisma/client';
import {
  type MovieCard,
  type MovieVideoType,
  type MovieWithTags,
  type WatchProvider,
} from '@cinemo/shared';
import {
  normalizeSearchQuery,
  searchQueryFallbacks,
} from '../lib/search-query';
import { UpsertProviderOverrideDto } from './dto/upsert-provider-override.dto';
import { AiService } from '../ai/ai.service';

type TmdbDiscoverMovie = {
  id: number;
  adult: boolean;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  genre_ids: number[];
};

type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

type TmdbWatchProvidersResponse = {
  results?: {
    KR?: {
      flatrate?: TmdbProvider[];
      rent?: TmdbProvider[];
      buy?: TmdbProvider[];
    };
  };
};

type TmdbVideo = {
  key: string;
  site: string;
  type: string;
  official: boolean;
};

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly aiService: AiService,
  ) {}

  private async get<T>(
    path: string,
    query: Record<string, string> = {},
  ): Promise<T> {
    const baseUrl = this.configService.getOrThrow<string>('tmdb.baseUrl');
    const token = this.configService.getOrThrow<string>('tmdb.accessToken');
    const url = new URL(`${baseUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `TMDB 요청 실패 (${response.status})`,
      );
    }
    return response.json();
  }

  private pickPreferredVideo(videos: TmdbVideo[]) {
    const pick = (type: MovieVideoType) => {
      const tmdbType = type === 'trailer' ? 'Trailer' : 'Teaser';

      return [...videos]
        .filter(
          (video) =>
            video.key.trim() &&
            video.site.trim().toLocaleLowerCase('en-US') === 'youtube' &&
            video.type.trim().toLocaleLowerCase('en-US') ===
              tmdbType.toLocaleLowerCase('en-US'),
        )
        .sort((a, b) => Number(b.official) - Number(a.official))[0];
    };

    const trailer = pick('trailer');
    if (trailer) return { key: trailer.key, type: 'trailer' as const };

    const teaser = pick('teaser');
    return teaser ? { key: teaser.key, type: 'teaser' as const } : null;
  }

  /** TMDB providers + admin override merge */
  private mergeProviders(
    base: WatchProvider[],
    overrides: {
      providerId: number;
      providerName: string;
      logoPath: string | null;
      action: 'add' | 'remove';
    }[],
  ): WatchProvider[] {
    const map = new Map<number, WatchProvider>();
    for (const provider of base) map.set(provider.id, provider);
    for (const override of overrides) {
      if (override.action === 'remove') map.delete(override.providerId);
    }
    for (const override of overrides) {
      if (override.action === 'add') {
        map.set(override.providerId, {
          id: override.providerId,
          name: override.providerName,
          logo_path: override.logoPath ?? '',
        });
      }
    }
    return this.collapseDisplayProviders([...map.values()]);
  }

  /** 구독 id가 있으면 같은 서비스 rent/buy id 숨김 */
  private collapseDisplayProviders(
    providers: WatchProvider[],
  ): WatchProvider[] {
    const map = new Map(providers.map((p) => [p.id, p]));
    if (map.has(2) && map.has(350)) map.delete(2); // Apple TV → Apple TV+
    if (map.has(10) && map.has(119)) map.delete(10); // Amazon Video → Prime
    return [...map.values()];
  }

  async getMergeProviders(
    tmdbId: number,
    base: WatchProvider[],
  ): Promise<WatchProvider[]> {
    const overrides = await this.prismaService.movieProviderOverride.findMany({
      where: { tmdbId },
      orderBy: { updatedAt: 'asc' },
    });
    return this.mergeProviders(base, overrides);
  }

  async getMovieGenres(language = 'ko') {
    return this.get<{ genres: { id: number; name: string }[] }>(
      '/genre/movie/list',
      { language },
    );
  }

  async discoverMovies(
    filters: Record<string, string> = {},
    page = 1,
    language = 'ko-KR',
  ) {
    return this.get<{
      page: number;
      total_pages: number;
      results: TmdbDiscoverMovie[];
    }>('/discover/movie', {
      sort_by: 'popularity.desc',
      language,
      page: page.toString(),
      ...filters,
      include_adult: 'false',
    });
  }

  /**
   * ko-KR overview 없거나 title이 한글/영어가 아닐 때 Claude로 보정.
   * DB에 바로 upsert → 다음 요청부터 DB hit (AI 재호출 없음).
   */
  private async enrichIfNeeded(
    tmdbId: number,
    title: string,
    overview: string,
    releaseDate: string,
    director: string | null,
  ): Promise<{ title: string; overview: string; director: string | null }> {
    const needsOverview = this.isInsufficientOverview(overview);
    const needsTitle =
      !/\p{Script=Hangul}/u.test(title) && /[^\u0020-\u007E]/.test(title);
    const needsDirector =
      !!director &&
      !/\p{Script=Hangul}/u.test(director) &&
      /[^\u0020-\u007E]/.test(director);
    if (!needsOverview && !needsTitle && !needsDirector)
      return { title, overview, director };

    const enDetail = await this.getMovieDetail(tmdbId, 'en-US');
    const titleEn = enDetail.title ?? title;
    const overviewEn = enDetail.overview ?? '';
    const year = releaseDate.slice(0, 4) ?? '';

    let newTitle = title;
    let newOverview = overview;
    let newDirector = director;

    if (needsOverview && overviewEn) {
      const translatedOverview = await this.aiService.translateOverview(
        titleEn,
        overviewEn,
      );
      if (this.isUsableTranslatedOverview(translatedOverview)) {
        newOverview = translatedOverview;
      }
    }
    if (needsTitle) {
      newTitle = (await this.aiService.koreanTitle(titleEn, year)) ?? titleEn;
    }
    if (needsDirector && director) {
      const kor = await this.aiService.koreanDirector(director);
      if (kor) newDirector = `${director} (${kor})`;
    }
    if (
      newTitle !== title ||
      newOverview !== overview ||
      newDirector !== director
    ) {
      await this.prismaService.moviePool.update({
        where: { tmdbId },
        data: { title: newTitle, overview: newOverview, director: newDirector },
      });
    }
    return { title: newTitle, overview: newOverview, director: newDirector };
  }

  /** MoviePool row → MovieCard (DB의 providers 사용) */
  private async fromPool(row: MoviePool): Promise<MovieCard> {
    const base = Array.isArray(row.providers)
      ? (row.providers as WatchProvider[])
      : [];
    const providers = await this.getMergeProviders(row.tmdbId, base);
    const movie: MovieCard = {
      id: row.tmdbId,
      title: row.title,
      overview: row.overview,
      poster_path: row.posterPath,
      release_date: row.releaseDate,
      director: row.director,
      providers,
    };
    void this.enrichIfNeeded(
      row.tmdbId,
      movie.title,
      movie.overview ?? '',
      movie.release_date ?? '',
      movie.director ?? null,
    ).catch((error) =>
      this.logger.warn(`background enrich 실패: ${(error as Error).message}`),
    );
    return movie;
  }

  async getMovieCached(
    movieId: number,
    opts?: { force?: boolean },
  ): Promise<MovieCard> {
    const cached = await this.prismaService.moviePool.findUnique({
      where: { tmdbId: movieId },
    });

    const hasInvalidTitle =
      !cached?.title?.trim() ||
      cached.title.includes('정보를 찾을 수 없습니다.');

    if (
      !opts?.force &&
      cached &&
      !hasInvalidTitle &&
      (cached.genreIds.length > 0 || cached.originCountries.length > 0)
    ) {
      return await this.fromPool(cached);
    }
    const movie = await this.getMovie(movieId);

    if (
      !movie.title.trim() ||
      movie.title.includes('정보를 찾을 수 없습니다.')
    ) {
      throw new ServiceUnavailableException(
        '영화 정보를 저장할 수 없는 상태입니다.',
      );
    }
    const { genre_ids, origin_countries, providers, ...card } = movie;

    await this.prismaService.moviePool.upsert({
      where: { tmdbId: movieId },
      create: {
        tmdbId: movieId,
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date ?? '',
        director: movie.director,
        genreIds: genre_ids,
        originCountries: origin_countries,
        providers,
      },
      update: {
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date ?? '',
        director: movie.director,
        genreIds: genre_ids,
        originCountries: origin_countries,
        providers,
        syncedAt: new Date(),
      },
    });

    void this.enrichIfNeeded(
      movieId,
      movie.title,
      movie.overview ?? '',
      movie.release_date ?? '',
      movie.director ?? null,
    ).catch((error) =>
      this.logger.warn(
        `background enrich (miss) 실패: ${(error as Error).message}`,
      ),
    );

    return {
      ...card,
      providers: await this.getMergeProviders(movieId, providers),
    };
  }

  async listProviderOverrides(tmdbId: number) {
    return this.prismaService.movieProviderOverride.findMany({
      where: { tmdbId },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async upsertProviderOverride(userId: string, dto: UpsertProviderOverrideDto) {
    return this.prismaService.movieProviderOverride.upsert({
      where: {
        tmdbId_providerId_action: {
          tmdbId: dto.tmdbId,
          providerId: dto.providerId,
          action: dto.action,
        },
      },
      create: {
        tmdbId: dto.tmdbId,
        providerId: dto.providerId,
        providerName: dto.providerName,
        logoPath: dto.logoPath,
        action: dto.action,
        createdBy: userId,
      },
      update: {
        providerName: dto.providerName,
        logoPath: dto.logoPath,
        note: dto.note ?? null,
      },
    });
  }

  async pickRandomMovie(
    filters: Record<string, string> = {},
    excludeIds: number[] = [],
  ): Promise<MovieCard> {
    const exclude = new Set(excludeIds);

    // 풀 우선: watched 제외 + 장르/국적 태그 + 포스터 있는 것만 + title에 이 영화에 대한 정보를 찾을 수 없습니다. 같은 것 제외
    const where = {
      title: { not: { contains: '정보를 찾을 수 없습니다.' } },
      posterPath: { not: null },
      ...(excludeIds.length > 0 ? { tmdbId: { notIn: excludeIds } } : {}),
      ...(filters.with_genres
        ? { genreIds: { has: Number(filters.with_genres) } }
        : {}),
      ...(filters.with_origin_country
        ? { originCountries: { has: filters.with_origin_country } }
        : {}),
    };
    const count = await this.prismaService.moviePool.count({ where });
    if (count > 0) {
      const row = await this.prismaService.moviePool.findFirst({
        where,
        skip: Math.floor(Math.random() * count),
      });
      if (row) return await this.fromPool(row);
    }

    // 풀 miss · 태그 없는 옛 row → Discover
    const first = await this.discoverMovies(filters, 1);
    if (!first.results.length || first.total_pages < 1) {
      throw new ServiceUnavailableException('TMDB에서 영화를 찾지 못했습니다.');
    }
    for (let attempt = 0; attempt < 8; attempt++) {
      const page =
        Math.floor(Math.random() * Math.min(first.total_pages, 20)) + 1;
      const picked =
        page === 1 ? first : await this.discoverMovies(filters, page);
      const list = picked.results.filter(
        (movie) => !exclude.has(movie.id) && movie.poster_path,
      );
      if (!list.length) continue;

      const movie = list[Math.floor(Math.random() * list.length)]!;
      const result = await this.getMovieCached(movie.id);
      if (result.poster_path) return result;
    }
    throw new ServiceUnavailableException('뽑을 수 있는 영화가 없습니다.');
  }

  private async resolveOverview(
    movieId: number,
    title: string,
    overview: string,
  ): Promise<string> {
    if (!this.isInsufficientOverview(overview)) return overview;
    try {
      const englishDetail = await this.getMovieDetail(movieId, 'en-US');
      if (!englishDetail.overview?.trim()) return '';
      const translatedOverview = await this.aiService.translateOverview(
        englishDetail.title || title,
        englishDetail.overview,
      );

      if (!this.isUsableTranslatedOverview(translatedOverview)) {
        return overview;
      }

      await this.prismaService.moviePool.updateMany({
        where: {
          tmdbId: movieId,
          overview,
        },
        data: { overview: translatedOverview },
      });

      return translatedOverview;
    } catch {
      return '';
    }
  }

  private isUsableTranslatedOverview(value: string | null): value is string {
    const text = value?.trim();
    if (!text) return false;

    return !/I don't have access|I cannot|I can't|정보를 찾을 수 없|번역할 수 없|죄송|알 수 없/i.test(
      text,
    );
  }

  private isInsufficientOverview(overview: string): boolean {
    const text = overview.trim();
    if (!text) return true;

    const sentenceCount = text
      .split(/[.!?。！？]+/)
      .filter((sentence) => sentence.trim()).length;

    return text.length < 80 || sentenceCount < 2;
  }

  /** TMDB id → 앱용 영화 카드 (감독 포함) */
  async getMovie(movieId: number): Promise<MovieWithTags> {
    const detail = await this.getMovieDetail(movieId);
    const director =
      detail.credits?.crew?.find((crew) => crew.job === 'Director')?.name ??
      null;
    const cast =
      detail.credits?.cast
        ?.sort((a, b) => a.order - b.order)
        .slice(0, 5)
        .map((actor) => actor.name) ?? [];

    const genre_ids = detail.genres?.map((g) => g.id) ?? [];
    const origin_countries =
      detail.production_countries?.map((c) => c.iso_3166_1) ?? [];
    const providers = await this.getMovieProviders(movieId);
    const overview = await this.resolveOverview(
      movieId,
      detail.title,
      detail.overview,
    );
    const video = this.pickPreferredVideo(detail.videos?.results ?? []);

    const trailerUrl = video
      ? `https://www.youtube.com/watch?v=${video.key}`
      : null;

    return {
      id: movieId,
      title: detail.title,
      overview,
      poster_path: detail.poster_path,
      release_date: detail.release_date,
      director,
      cast,
      providers,
      genre_ids,
      trailerUrl,
      videoType: video?.type ?? null,
      origin_countries,
    };
  }

  async isValidMovieRecord(movieId: number): Promise<boolean> {
    try {
      const detail = await this.getMovieDetail(movieId);
      return Boolean(detail.title?.trim() && detail.release_date?.trim());
    } catch {
      return false;
    }
  }

  /** 동일 서비스의 하위 티어 id → 대표 id 매핑 */
  private static readonly PROVIDER_CANONICAL: Record<number, number> = {
    1796: 8, // Netflix Standard with Ads → Netflix
  };

  async getMovieProviders(movieId: number): Promise<WatchProvider[]> {
    try {
      const data = await this.get<TmdbWatchProvidersResponse>(
        `/movie/${movieId}/watch/providers`,
      );
      const kr = data.results?.KR ?? {};
      const all = [
        ...(kr.flatrate ?? []),
        ...(kr.rent ?? []),
        ...(kr.buy ?? []),
      ];
      const seen = new Set<number>();
      const merged = all
        .filter((p) => {
          // 같은 서비스의 다른 티어는 대표 id로 통일
          const canonical =
            TmdbService.PROVIDER_CANONICAL[p.provider_id] ?? p.provider_id;
          if (seen.has(canonical)) return false;
          seen.add(canonical);
          return true;
        })
        .map((p) => ({
          id: TmdbService.PROVIDER_CANONICAL[p.provider_id] ?? p.provider_id,
          name: p.provider_name
            .replace(/\s*(Standard with Ads|with Ads)\s*/i, '')
            .trim(),
          logo_path: p.logo_path,
        }));
      return this.collapseDisplayProviders(merged);
    } catch (error) {
      return [];
    }
  }

  private async getMovieDetail(movieId: number, language = 'ko-KR') {
    return this.get<{
      title: string;
      overview: string;
      poster_path: string | null;
      release_date: string;
      credits?: {
        crew: { job: string; name: string }[];
        cast?: { name: string; order: number }[];
      };
      videos?: {
        results: {
          key: string;
          site: string;
          type: string;
          official: boolean;
        }[];
      };
      genres?: { id: number; name: string }[];
      production_countries?: { iso_3166_1: string; name: string }[];
    }>(`/movie/${movieId}`, {
      language,
      append_to_response: 'credits,videos',
    });
  }

  private async fetchSearchMovies(q: string, page: number) {
    const data = await this.get<{
      page: number;
      total_pages: number;
      results: TmdbDiscoverMovie[];
    }>('/search/movie', {
      query: q,
      language: 'ko-KR',
      include_adult: 'false',
      page: String(page),
    });
    return {
      page: data.page,
      total_pages: data.total_pages,
      results: data.results.map((m) => ({
        id: m.id,
        title: m.title,
        original_title: m.original_title,
        original_language: m.original_language,
        overview: m.overview,
        poster_path: m.poster_path,
        release_date: m.release_date ?? '',
      })),
    };
  }

  async searchMovies(query: string, page = 1) {
    const q = normalizeSearchQuery(query);
    if (!q) return { page: 1, results: [] as MovieCard[], total_pages: 0 };

    let result = await this.fetchSearchMovies(q, page);
    if (result.results.length > 0) return result;

    for (const alt of searchQueryFallbacks(q)) {
      result = await this.fetchSearchMovies(alt, page);
      if (result.results.length > 0) return result;
    }

    return result;
  }

  async getMovieTrailer(movieId: number): Promise<string | null> {
    const video = await this.getMovieVideo(movieId);
    return video?.url ?? null;
  }

  async getMovieVideo(movieId: number) {
    const detail = await this.getMovieDetail(movieId);
    const video = this.pickPreferredVideo(detail.videos?.results ?? []);

    return video
      ? {
          url: `https://www.youtube.com/watch?v=${video.key}`,
          videoType: video.type,
        }
      : null;
  }
}
