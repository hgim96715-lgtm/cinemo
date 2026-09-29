import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../config/env.keys';
import type { KmdbSearchResponse } from './types/kmdb-api-response.type';

@Injectable()
export class KmdbService {
  private readonly kmdbUrl: string;
  private readonly kmdbApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.kmdbUrl = this.configService.getOrThrow<string>(EnvKeys.KMDB_BASE_URL);

    this.kmdbApiKey = this.configService.getOrThrow<string>(
      EnvKeys.KMDB_API_KEY,
    );
  }

  async searchMovies(query: string, page = 1, limit = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const url = new URL(this.kmdbUrl);

    url.searchParams.set('ServiceKey', this.kmdbApiKey);
    url.searchParams.set('collection', 'kmdb_new2');
    url.searchParams.set('detail', 'Y');
    url.searchParams.set('query', query.trim());
    url.searchParams.set('listCount', String(safeLimit));
    url.searchParams.set('startCount', String((safePage - 1) * safeLimit));

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `KMDb 영화 검색 요청 실패 (${response.status})`,
      );
    }

    const data = (await response.json()) as KmdbSearchResponse;
    const results = data.Data?.[0]?.Result ?? [];
    const normalizeTitle = (title: string) =>
      title
        .replace(/!HS|!HE/g, '')
        .trim()
        .toLocaleLowerCase('ko-KR')
        .replace(/[\s\p{P}\p{S}]+/gu, '');
    const normalizedQuery = normalizeTitle(query);

    const normalizedResults = results.map((movie) => {
      const originalTitle = (movie.title ?? '').replace(/!HS|!HE/g, '').trim();
      const titleCandidates = [
        originalTitle,
        ...(movie.titleEtc?.split(/[\^,]/) ?? []),
      ]
        .map((title) => title.replace(/!HS|!HE/g, '').trim())
        .filter(Boolean);

      const releaseDates =
        movie.ratings?.rating
          ?.map((rating) => rating.releaseDate)
          .filter(
            (date): date is string =>
              typeof date === 'string' && /^\d{8}$/.test(date),
          )
          .sort() ?? [];

      const latestReleaseDate = releaseDates.at(-1) ?? movie.repRlsDate ?? null;
      const isReRelease = Boolean(
        latestReleaseDate &&
          movie.repRlsDate &&
          latestReleaseDate > movie.repRlsDate,
      );

      const reReleaseTitle = titleCandidates.find((title) =>
        /앙코르|재개봉/.test(title),
      );
      const queryMatchedTitle = titleCandidates.find((title) => {
        const normalizedTitle = normalizeTitle(title);

        return (
          normalizedTitle === normalizedQuery ||
          normalizedTitle.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedTitle)
        );
      });
      const displayTitle =
        reReleaseTitle ??
        queryMatchedTitle ??
        titleCandidates.find((title) => /\p{Script=Hangul}/u.test(title)) ??
        originalTitle;

      const posterUrl =
        typeof movie.posters === 'string'
          ? (movie.posters.split('|')[0] ?? null)
          : null;

      const vodUrl = movie.vods?.vod?.[0]?.vodUrl ?? null;
      const overview =
        movie.plots?.plot?.find((plot) => plot.plotLang === '한국어')
          ?.plotText ?? movie.plots?.plot?.[0]?.plotText ?? null;
      const director =
        movie.directors?.director
          ?.map((item) => item.directorNm?.trim())
          .filter((name): name is string => Boolean(name))
          .join(', ') || null;
      const cast =
        movie.actors?.actor
          ?.map((item) => item.actorNm?.trim())
          .filter((name): name is string => Boolean(name)) ?? [];

      return {
        ...movie,
        title: displayTitle,
        releaseDate: latestReleaseDate,
        posterUrl,
        vodUrl,
        overview,
        director,
        cast,
        genres: movie.genre
          ?.split(',')
          .map((genre) => genre.trim())
          .filter(Boolean) ?? [],
        productionYear: movie.prodYear ?? null,
        isReRelease,
      };
    });

    return {
      totalCount: data.Data?.[0]?.TotalCount ?? 0,
      results: normalizedResults,
    };
  }
}
