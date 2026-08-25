import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../config/env.keys';
import { PrismaService } from '../prisma/prisma.service';
import type { MoviePool } from '../generated/prisma/client';
import {
  GACHA_MACHINES,
  GACHA_TMDB_FILTERS,
  type GachaMovie,
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
    const baseUrl = this.configService.getOrThrow(EnvKeys.TMDB_BASE_URL);
    const token = this.configService.getOrThrow(EnvKeys.TMDB_ACCESS_TOKEN);
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

  private seedProgress: {
    done: number;
    total: number;
    machineId: string;
  } | null = null;

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
    const needsOverview = overview.trim() === '';
    const needsTitle =
      !/[\uAC00-\uD7AF]/.test(title) && /[^\u0020-\u007E]/.test(title);
    const needsDirector =
      !!director &&
      !/[\uAC00-\uD7AF]/.test(director) &&
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
      newOverview =
        (await this.aiService.translateOverview(titleEn, overviewEn)) ??
        overview;
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

  /** MoviePool row → GachaMovie (DB의 providers 사용) */
  private async fromPool(row: MoviePool): Promise<GachaMovie> {
    const base = Array.isArray(row.providers)
      ? (row.providers as WatchProvider[])
      : [];
    const providers = await this.getMergeProviders(row.tmdbId, base);
    const movie: GachaMovie = {
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
  ): Promise<GachaMovie> {
    const cached = await this.prismaService.moviePool.findUnique({
      where: { tmdbId: movieId },
    });

    if (
      !opts?.force &&
      cached &&
      (cached.genreIds.length > 0 || cached.originCountries.length > 0)
    ) {
      return await this.fromPool(cached);
    }
    const movie = await this.getMovie(movieId);
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

  async seedPool(
    filters: Record<string, string> = {},
    pages = 5,
    opts?: {
      onPageDone?: (
        page: number,
        stats: {
          processedPages: number;
          fetchedCount: number;
          savedCount: number;
          skippedCount: number;
          failedCount: number;
        },
      ) => void | Promise<void>;
    },
  ): Promise<{
    ok: boolean;
    processedPages: number;
    fetchedCount: number;
    savedCount: number;
    skippedCount: number;
    failedCount: number;
  }> {
    let processedPages = 0;
    let fetchedCount = 0;
    let savedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    for (let page = 1; page <= pages; page++) {
      const { results } = await this.discoverMovies(filters, page);
      fetchedCount += results.length;
      for (const movie of results) {
        if (!movie.poster_path) {
          skippedCount += 1;
          continue;
        }
        try {
          await this.getMovieCached(movie.id, { force: true });
          savedCount += 1;
        } catch (error) {
          failedCount += 1;
          this.logger.warn(
            `MoviePool 저장 실패 (${movie.id}): ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
      processedPages += 1;
      await opts?.onPageDone?.(page, {
        processedPages,
        fetchedCount,
        savedCount,
        skippedCount,
        failedCount,
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return {
      ok: failedCount === 0,
      processedPages,
      fetchedCount,
      savedCount,
      skippedCount,
      failedCount,
    };
  }

  async seedPoolAll(pages = 10): Promise<
    Record<
      string,
      {
        ok: boolean;
        processedPages: number;
        fetchedCount: number;
        savedCount: number;
        skippedCount: number;
        failedCount: number;
      }
    >
  > {
    const results: Record<
      string,
      {
        ok: boolean;
        processedPages: number;
        fetchedCount: number;
        savedCount: number;
        skippedCount: number;
        failedCount: number;
      }
    > = {};
    const total = GACHA_MACHINES.length * pages;
    let done = 0;
    this.seedProgress = { done: 0, total, machineId: '' };

    try {
      for (const machine of GACHA_MACHINES) {
        const result = await this.seedPool(
          GACHA_TMDB_FILTERS[machine.id],
          pages,
          {
            onPageDone: () => {
              done += 1;
              this.seedProgress = {
                done,
                total,
                machineId: machine.id,
              };
            },
          },
        );
        results[machine.id] = result;
      }
      return results;
    } finally {
      this.seedProgress = null;
    }
  }

  getSeedProgress() {
    return this.seedProgress;
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
  ): Promise<GachaMovie> {
    const exclude = new Set(excludeIds);

    // 풀 우선: watched 제외 + 장르/국적 태그 + 포스터 있는 것만
    const where = {
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

  /** TMDB id → 앱용 영화 카드 (감독 포함) */
  async getMovie(movieId: number): Promise<MovieWithTags> {
    const detail = await this.getMovieDetail(movieId);
    const director =
      detail.credits?.crew?.find((c) => c.job === 'Director')?.name ?? null;
    const genre_ids = detail.genres?.map((g) => g.id) ?? [];
    const origin_countries =
      detail.production_countries?.map((c) => c.iso_3166_1) ?? [];
    const providers = await this.getMovieProviders(movieId);
    return {
      id: movieId,
      title: detail.title,
      overview: detail.overview,
      poster_path: detail.poster_path,
      release_date: detail.release_date,
      director,
      providers,
      genre_ids,
      origin_countries,
    };
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
      credits?: { crew: { job: string; name: string }[] };
      genres?: { id: number; name: string }[];
      production_countries?: { iso_3166_1: string; name: string }[];
    }>(`/movie/${movieId}`, {
      language,
      append_to_response: 'credits',
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
        overview: m.overview,
        poster_path: m.poster_path,
        release_date: m.release_date ?? '',
      })),
    };
  }

  async searchMovies(query: string, page = 1) {
    const q = normalizeSearchQuery(query);
    if (!q) return { page: 1, results: [] as GachaMovie[], total_pages: 0 };

    let result = await this.fetchSearchMovies(q, page);
    if (result.results.length > 0) return result;

    for (const alt of searchQueryFallbacks(q)) {
      result = await this.fetchSearchMovies(alt, page);
      if (result.results.length > 0) return result;
    }

    return result;
  }
}
