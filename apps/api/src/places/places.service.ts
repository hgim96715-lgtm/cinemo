import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../config/env.keys';

type KakaoPlaceDocument = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  x: string;
  y: string;
};

type KakaoKeywordResponse = {
  documents: KakaoPlaceDocument[];
};

export type PlaceSearchResult = {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  placeUrl: string;
  longitude: number;
  latitude: number;
};

@Injectable()
export class PlacesService {
  constructor(private readonly configService: ConfigService) {}

  async search(query: string): Promise<PlaceSearchResult[]> {
    const keyword = query.trim();
    if (keyword.length < 2) {
      return [];
    }

    const apiKey = this.configService.get<string>(EnvKeys.KAKAO_REST_API_KEY);

    if (!apiKey) {
      throw new ServiceUnavailableException(
        '장소 검색 API 키가 설정되지 않았습니다.',
      );
    }

    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');

    url.searchParams.set('query', keyword);
    url.searchParams.set('size', '15');

    const normalize = (value: string) =>
      value.replace(/\s+/g, '').toLowerCase();

    const normalizedKeyword = normalize(keyword);
    const keywordTokens = keyword.split(/\s+/).filter(Boolean).map(normalize);

    const getMatchScore = (place: KakaoPlaceDocument) => {
      const normalizedName = normalize(place.place_name);
      const normalizedAddress = normalize(
        `${place.address_name} ${place.road_address_name}`,
      );
      if (normalizedName === normalizedKeyword) return 0;
      if (normalizedName.startsWith(normalizedKeyword)) return 1;
      if (keywordTokens.every((token) => normalizedName.includes(token)))
        return 2;

      if (keywordTokens.every((token) => normalizedAddress.includes(token)))
        return 3;

      return 4;
    };

    const fetchKakaoPage = async (
      searchQuery: string,
      page: number,
    ): Promise<KakaoKeywordResponse> => {
      const pageUrl = new URL(url);
      pageUrl.searchParams.set('query', searchQuery);
      pageUrl.searchParams.set('page', String(page));

      const response = await fetch(pageUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `KakaoAK ${apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        const errorBody = await response.text();

        console.error('[Kakao Places Error]', {
          status: response.status,
          body: errorBody,
        });

        throw new ServiceUnavailableException(
          `카카오 장소 검색 실패 (${response.status})`,
        );
      }
      return (await response.json()) as KakaoKeywordResponse;
    };

    const directData = await fetchKakaoPage(keyword, 1);
    const documents = directData.documents;

    return [...documents]
      .sort((a, b) => {
        const scoreDifference = getMatchScore(a) - getMatchScore(b);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return a.place_name.length - b.place_name.length;
      })
      .map((place) => ({
        id: place.id,
        name: place.place_name,
        category: place.category_name,
        address: place.address_name,
        roadAddress: place.road_address_name,
        placeUrl: place.place_url,
        longitude: Number(place.x),
        latitude: Number(place.y),
      }));
  }
}
