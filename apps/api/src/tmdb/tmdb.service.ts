import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { EnvKeys } from '../config/env.keys';
import type { MovieDetailDto } from './dto/movie-detail.dto';
import type { MovieSummaryDto } from './dto/movie-summary.dto';
import type { MovieGenresResponseDto } from './dto/movie-genre.dto';
import type { MovieDiscoverResponseDto } from './dto/movie-discover.dto';
import type { MovieSearchResponseDto } from './dto/movie-search.dto';
import {
  normalizeSearchQuery,
  searchQueryFallbacks,
} from '../lib/search-query';

import {
  TmdbMovieDetailResponse,
  TmdbVideoResponse,
} from './types/tmdb-movie-response.type';

const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly aiService: AiService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>(EnvKeys.TMDB_BASE_URL);
    this.token = this.configService.getOrThrow<string>(
      EnvKeys.TMDB_ACCESS_TOKEN,
    );
  }
  private async get<T>(
    path: string,
    query: Record<string, string | number | boolean> = {},
  ): Promise<T> {
    const baseUrl = this.baseUrl.replace(/\/+$/, '');
    const url = new URL(`${baseUrl}${path}`);

    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      this.logger.error(`TMDB 요청 실패: ${response.status} ${path}`);

      throw new ServiceUnavailableException(
        `TMDB 요청 실패 (${response.status})`,
      );
    }

    return (await response.json()) as T;
  }

  private async fetchSearchMovies(
    query: string,
    page: number,
  ): Promise<MovieSearchResponseDto> {
    return this.get<MovieSearchResponseDto>('/search/movie', {
      query,
      language: 'ko-KR',
      include_adult: 'false',
      page,
    });
  }
  private async getMovieDetail(
    movieId: number,
    language = 'ko-KR',
  ): Promise<TmdbMovieDetailResponse> {
    return this.get<TmdbMovieDetailResponse>(`/movie/${movieId}`, {
      language,
      append_to_response: 'credits,videos',
    });
  }

  private findTrailer(
    videos: TmdbVideoResponse[],
  ): { key: string; type: 'trailer' } | null {
    const trailer = videos
      .filter(
        (video) =>
          video.key.trim() &&
          video.site.toLowerCase() === 'youtube' &&
          video.type.toLowerCase() === 'trailer',
      )
      .sort((a, b) => Number(b.official) - Number(a.official))[0];

    if (!trailer) {
      return null;
    }

    return {
      key: trailer.key,
      type: 'trailer',
    };
  }

  async getMovieGenres(language = 'ko'): Promise<MovieGenresResponseDto> {
    return this.get<MovieGenresResponseDto>('/genre/movie/list', {
      language,
    });
  }

  async getRawMovieResponse(movieId: number): Promise<unknown> {
    return this.get<unknown>(`/movie/${movieId}`, {
      language: 'ko-KR',
      append_to_response: 'credits,videos',
    });
  }

  async getMovie(movieId: number): Promise<MovieDetailDto> {
    const detail = await this.getMovieDetail(movieId);

    const director =
      detail.credits?.crew.find((crew) => crew.job === 'Director')?.name ??
      null;

    const cast = await Promise.all(
      (detail.credits?.cast ?? [])
        .sort((a, b) => a.order - b.order)
        .slice(0, 5)
        .map(async (actor) => {
          if (/\p{Script=Hangul}/u.test(actor.name)) {
            return actor.name;
          }

          return (
            (await this.aiService.koreanPersonName(actor.name)) ?? actor.name
          );
        }),
    );

    const video = this.findTrailer(detail.videos?.results ?? []);

    return {
      id: detail.id,
      title: detail.title,
      overview: detail.overview,
      poster_path: detail.poster_path,
      release_date: detail.release_date,
      director,
      cast,
      genre_ids: detail.genres?.map((genre) => genre.id) ?? [],
      trailerUrl: video ? `${YOUTUBE_WATCH_URL}${video.key}` : null,
      videoType: video?.type ?? null,
      origin_countries:
        detail.production_countries?.map((country) => country.iso_3166_1) ?? [],
    };
  }

  async getMovieCached(
    movieId: number,
    options?: { force?: boolean },
  ): Promise<MovieSummaryDto> {
    const cachedMovie = await this.prismaService.moviePool.findUnique({
      where: { tmdbId: movieId },
    });

    if (cachedMovie && !options?.force) {
      return {
        id: cachedMovie.tmdbId,
        title: cachedMovie.title,
        overview: cachedMovie.overview,
        poster_path: cachedMovie.posterPath,
        release_date: cachedMovie.releaseDate,
        director: cachedMovie.director,
        genre_ids: cachedMovie.genreIds,
      };
    }

    const movie = await this.getMovie(movieId);

    await this.prismaService.moviePool.upsert({
      where: { tmdbId: movieId },
      create: {
        tmdbId: movieId,
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        director: movie.director,
        genreIds: movie.genre_ids,
        originCountries: movie.origin_countries,
      },
      update: {
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        director: movie.director,
        genreIds: movie.genre_ids,
        originCountries: movie.origin_countries,
        syncedAt: new Date(),
      },
    });

    return movie;
  }

  async resolveMovieMedia(
    title: string,
    cached?: {
      tmdbId?: number | null;
      posterPath?: string | null;
    },
  ) {
    let tmdbId = cached?.tmdbId ?? null;
    let posterPath = cached?.posterPath ?? null;

    if (!tmdbId) {
      try {
        const searchResponse = await this.searchMovies(title);
        const movie =
          searchResponse.results.find((item) => item.poster_path) ??
          searchResponse.results[0];

        tmdbId = movie?.id ?? null;
        posterPath = movie?.poster_path ?? null;
      } catch (error) {
        this.logger.warn(`TMDB 영화 검색 실패: ${title}`);
      }
    }

    if (!tmdbId) {
      return {
        tmdbId: null,
        posterPath,
        trailerUrl: null,
        videoType: null,
      };
    }

    try {
      const detail = await this.getMovieDetail(tmdbId);
      const trailer = this.findTrailer(detail.videos?.results ?? []);

      return {
        tmdbId,
        posterPath: posterPath ?? detail.poster_path,
        trailerUrl: trailer ? `${YOUTUBE_WATCH_URL}${trailer.key}` : null,
        videoType: trailer?.type ?? null,
      };
    } catch {
      return {
        tmdbId,
        posterPath,
        trailerUrl: null,
        videoType: null,
      };
    }
  }

  async discoverMovies(
    filters: Record<string, string> = {},
    page = 1,
    language = 'ko-KR',
  ): Promise<MovieDiscoverResponseDto> {
    return this.get<MovieDiscoverResponseDto>('/discover/movie', {
      sort_by: 'popularity.desc',
      language,
      page,
      include_adult: 'false',
      ...filters,
    });
  }

  async backfillMoviePool(pages = 5, force = false) {
    let discovered = 0;
    let saved = 0;
    let skipped = 0;
    let failed = 0;

    for (let page = 1; page <= pages; page += 1) {
      const discover = await this.discoverMovies({}, page);

      for (const movie of discover.results) {
        discovered += 1;

        if (!force) {
          const cached = await this.prismaService.moviePool.findUnique({
            where: { tmdbId: movie.id },
            select: { id: true },
          });

          if (cached) {
            skipped += 1;
            continue;
          }
        }

        try {
          await this.getMovieCached(movie.id, { force: true });
          saved += 1;
        } catch (error: unknown) {
          failed += 1;
          this.logger.warn(
            `movie_pool 저장 실패: tmdbId=${movie.id}`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      if (page >= discover.total_pages) break;
    }

    this.logger.log(
      `movie_pool 백필 완료: discovered=${discovered}, saved=${saved}, skipped=${skipped}, failed=${failed}`,
    );

    return { pages, discovered, saved, skipped, failed };
  }

  async searchMovies(query: string, page = 1): Promise<MovieSearchResponseDto> {
    const normalizedQuery = normalizeSearchQuery(query);

    if (!normalizedQuery) {
      return {
        page: 1,
        total_pages: 0,
        results: [],
      };
    }

    let result = await this.fetchSearchMovies(normalizedQuery, page);

    if (result.results.length > 0) {
      return result;
    }

    for (const fallbackQuery of searchQueryFallbacks(normalizedQuery)) {
      result = await this.fetchSearchMovies(fallbackQuery, page);

      if (result.results.length > 0) {
        return result;
      }
    }

    return result;
  }
}
