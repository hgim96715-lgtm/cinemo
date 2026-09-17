import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { MoviePool } from '../generated/prisma/client';
import {
  normalizeSearchQuery,
  searchQueryFallbacks,
} from '../lib/search-query';
import { AiService } from '../ai/ai.service';
import type { MovieDetailDto } from './dto/movie-detail.dto';
import type { MovieDiscoverResponseDto } from './dto/movie-discover.dto';
import type { MovieGenresResponseDto } from './dto/movie-genre.dto';
import type { MovieSearchResponseDto } from './dto/movie-search.dto';
import type { MovieSummaryDto } from './dto/movie-summary.dto';
import { EnvKeys } from '../config/env.keys';

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

type TmdbMovieDetail = {
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  credits?: {
    crew: { job: string; name: string }[];
    cast?: { name: string; order: number }[];
  };
  videos?: {
    results: TmdbVideo[];
  };
  genres?: { id: number; name: string }[];
  production_countries?: {
    iso_3166_1: string;
    name: string;
  }[];
};

type TmdbGenreResponse = {
  genres: {
    id: number;
    name: string;
  }[];
};

type TmdbVideo = {
  key: string;
  site: string;
  type: string;
  official: boolean;
};

type TmdbMovieVideoResult = {
  url: string;
  videoType: 'trailer';
};

export type TmdbMovieMedia = {
  tmdbId: number | null;
  posterPath: string | null;
  trailerUrl: string | null;
  videoType: 'trailer' | null;
  reReleaseDates: string[];
};

type TmdbMovieListResponse = {
  page: number;
  total_pages: number;
  results: TmdbDiscoverMovie[];
};

type TmdbMovieSearchItem = {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
};

type TmdbMovieSearchResponse = {
  page: number;
  total_pages: number;
  results: TmdbMovieSearchItem[];
};

type TmdbMovieReleaseDate = {
  certification: string;
  release_date: string;
  type: number;
};

type TmdbMovieCountryReleaseDates = {
  iso_3166_1: string;
  release_dates: TmdbMovieReleaseDate[];
};

type TmdbMovieReleaseDatesResponse = {
  results: TmdbMovieCountryReleaseDates[];
};

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
    query: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${this.token}`,
      },
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `TMDB 요청 실패 (${response.status})`,
      );
    }
    return response.json();
  }

  async getRawMovieResponse(movieId: number): Promise<unknown> {
    return this.get<unknown>(`/movie/${movieId}`, {
      language: 'ko-KR',
      append_to_response: 'release_dates,credits,videos',
    });
  }

  private async getMovieDetail(
    movieId: number,
    language = 'ko-KR',
  ): Promise<TmdbMovieDetail> {
    return this.get<TmdbMovieDetail>(`/movie/${movieId}`, {
      language,
      append_to_response: 'credits,videos',
    });
  }

  private async getMovieReleaseDates(
    movieId: number,
  ): Promise<TmdbMovieReleaseDatesResponse> {
    return this.get<TmdbMovieReleaseDatesResponse>(
      `/movie/${movieId}/release_dates`,
    );
  }

  private getKoreaTheaterDates(
    releaseDates: TmdbMovieReleaseDatesResponse,
  ): string[] {
    const korea = releaseDates.results.find(
      (country) => country.iso_3166_1 === 'KR',
    );

    const dates = (korea?.release_dates ?? [])
      .filter((release) => release.type === 2 || release.type === 3)
      .map((release) => release.release_date.slice(0, 10));

    return [...new Set(dates)].sort();
  }

  private getReleaseInfo(dates: string[]): {
    firstReleaseDate: string | null;
    reReleaseDates: string[];
  } {
    return {
      firstReleaseDate: dates[0] ?? null,
      reReleaseDates: dates.slice(1),
    };
  }

  private findTrailer(
    videos: TmdbVideo[],
  ): { key: string; type: 'trailer' } | null {
    const trailer = [...videos]
      .filter(
        (video) =>
          video.key.trim() &&
          video.site.trim().toLowerCase() === 'youtube' &&
          video.type.trim().toLowerCase() === 'trailer',
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
    return this.get<TmdbGenreResponse>('/genre/movie/list', {
      language,
    });
  }

  async discoverMovies(
    filters: Record<string, string> = {},
    page = 1,
    language = 'ko-KR',
  ): Promise<MovieDiscoverResponseDto> {
    return this.get<TmdbMovieListResponse>('/discover/movie', {
      sort_by: 'popularity.desc',
      language,
      page: String(page),
      include_adult: 'false',
      ...filters,
    });
  }

  async resolveMovieMedia(
    title: string,
    cached?: {
      tmdbId?: number | null;
      posterPath?: string | null;
    },
  ): Promise<TmdbMovieMedia> {
    let tmdbId = cached?.tmdbId ?? null;
    let posterPath = cached?.posterPath ?? null;

    let searchedMovie: TmdbMovieSearchItem | undefined;

    if (!tmdbId) {
      try {
        const searchResponse = await this.searchMovies(title);

        searchedMovie =
          searchResponse.results.find((movie) => movie.poster_path) ??
          searchResponse.results[0];

        tmdbId = searchedMovie?.id ?? null;
      } catch {
        tmdbId = null;
      }
    }

    posterPath ??= searchedMovie?.poster_path ?? null;

    if (!tmdbId) {
      return {
        tmdbId: null,
        posterPath,
        trailerUrl: null,
        videoType: null,
        reReleaseDates: [],
      };
    }

    const [videoResult, releaseDatesResult] = await Promise.allSettled([
      this.getMovieVideo(tmdbId),
      this.getMovieReleaseDates(tmdbId),
    ]);

    const video =
      videoResult.status === 'fulfilled' ? videoResult.value : null;
    const reReleaseDates =
      releaseDatesResult.status === 'fulfilled'
        ? this.getReleaseInfo(
            this.getKoreaTheaterDates(releaseDatesResult.value),
          ).reReleaseDates
        : [];

    return {
      tmdbId,
      posterPath,
      trailerUrl: video?.url ?? null,
      videoType: video?.videoType ?? null,
      reReleaseDates,
    };
  }

  private async updateMissingMovieInfo(
    tmdbId: number,
    title: string,
    overview: string,
    releaseDate: string,
    director: string | null,
  ): Promise<{ title: string; overview: string; director: string | null }> {
    const needsOverview = this.needsOverviewUpdate(overview);
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
      if (this.isValidTranslatedOverview(translatedOverview)) {
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

  async getMovieCached(
    movieId: number,
    options?: { force?: boolean },
  ): Promise<MovieSummaryDto> {
    const cachedMovie = await this.prismaService.moviePool.findUnique({
      where: { tmdbId: movieId },
    });

    const hasInvalidTitle =
      !cachedMovie?.title?.trim() ||
      cachedMovie.title.includes('정보를 찾을 수 없습니다.');

    const hasCachedTags =
      (cachedMovie?.genreIds.length ?? 0) > 0 ||
      (cachedMovie?.originCountries.length ?? 0) > 0;

    if (!options?.force && cachedMovie && !hasInvalidTitle && hasCachedTags) {
      return this.mapMoviePoolToCard(cachedMovie);
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

    await this.prismaService.moviePool.upsert({
      where: { tmdbId: movieId },
      create: {
        tmdbId: movieId,
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date ?? '',
        director: movie.director,
        genreIds: movie.genre_ids,
        originCountries: movie.origin_countries,
      },
      update: {
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date ?? '',
        director: movie.director,
        genreIds: movie.genre_ids,
        originCountries: movie.origin_countries,
        syncedAt: new Date(),
      },
    });

    void this.updateMissingMovieInfo(
      movieId,
      movie.title,
      movie.overview ?? '',
      movie.release_date ?? '',
      movie.director ?? null,
    ).catch((error) =>
      this.logger.warn(
        `영화 정보 백그라운드 보정 실패: ${(error as Error).message}`,
      ),
    );

    return {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      director: movie.director,
    };
  }

  private async mapMoviePoolToCard(
    moviePool: MoviePool,
  ): Promise<MovieSummaryDto> {
    const movie: MovieSummaryDto = {
      id: moviePool.tmdbId,
      title: moviePool.title,
      overview: moviePool.overview,
      poster_path: moviePool.posterPath,
      release_date: moviePool.releaseDate,
      director: moviePool.director,
    };

    void this.updateMissingMovieInfo(
      moviePool.tmdbId,
      movie.title,
      movie.overview ?? '',
      movie.release_date ?? '',
      movie.director ?? null,
    ).catch((error) => {
      this.logger.warn(
        `영화 정보 백그라운드 보정 실패: ${(error as Error).message}`,
      );
    });

    return movie;
  }

  private async getMovieOverview(
    movieId: number,
    title: string,
    overview: string,
  ): Promise<string> {
    if (!this.needsOverviewUpdate(overview)) return overview;
    try {
      const englishDetail = await this.getMovieDetail(movieId, 'en-US');
      if (!englishDetail.overview?.trim()) return '';
      const translatedOverview = await this.aiService.translateOverview(
        englishDetail.title || title,
        englishDetail.overview,
      );

      if (!this.isValidTranslatedOverview(translatedOverview)) {
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

  private isValidTranslatedOverview(value: string | null): value is string {
    const text = value?.trim();
    if (!text) return false;

    return !/I don't have access|I cannot|I can't|정보를 찾을 수 없|번역할 수 없|죄송|알 수 없/i.test(
      text,
    );
  }

  private needsOverviewUpdate(overview: string): boolean {
    const text = overview.trim();
    if (!text) return true;

    const sentenceCount = text
      .split(/[.!?。！？]+/)
      .filter((sentence) => sentence.trim()).length;

    return text.length < 80 || sentenceCount < 2;
  }

  /** TMDB id → 앱용 영화 카드 (감독 포함) */
  async getMovie(movieId: number): Promise<MovieDetailDto> {
    const detail = await this.getMovieDetail(movieId);
    const director =
      detail.credits?.crew?.find((crew) => crew.job === 'Director')?.name ??
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

    const genre_ids = detail.genres?.map((g) => g.id) ?? [];
    const origin_countries =
      detail.production_countries?.map((c) => c.iso_3166_1) ?? [];
    const overview = await this.getMovieOverview(
      movieId,
      detail.title,
      detail.overview,
    );
    const video = this.findTrailer(detail.videos?.results ?? []);

    const trailerUrl = video
      ? `https://www.youtube.com/watch?v=${video.key}`
      : null;

    const releaseDates = await this.getMovieReleaseDates(movieId);

    const koreaTheaterDates = this.getKoreaTheaterDates(releaseDates);

    const releaseInfo = this.getReleaseInfo(koreaTheaterDates);

    return {
      id: movieId,
      title: detail.title,
      overview,
      poster_path: detail.poster_path,
      release_date: detail.release_date,
      director,
      cast,
      genre_ids,
      trailerUrl,
      videoType: video?.type ?? null,
      origin_countries,
      firstReleaseDate: releaseInfo.firstReleaseDate,
      reReleaseDates: releaseInfo.reReleaseDates,
    };
  }

  private async fetchSearchMovies(
    query: string,
    page: number,
  ): Promise<MovieSearchResponseDto> {
    const data = await this.get<TmdbMovieListResponse>('/search/movie', {
      query,
      language: 'ko-KR',
      include_adult: 'false',
      page: String(page),
    });

    return {
      page: data.page,
      total_pages: data.total_pages,
      results: data.results.map((movie): TmdbMovieSearchItem => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        original_language: movie.original_language,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date ?? '',
      })),
    };
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

  async getMovieVideo(movieId: number): Promise<TmdbMovieVideoResult | null> {
    const detail = await this.getMovieDetail(movieId);
    const video = this.findTrailer(detail.videos?.results ?? []);

    if (!video) {
      return null;
    }

    return {
      url: `https://www.youtube.com/watch?v=${video.key}`,
      videoType: video.type,
    };
  }
}
