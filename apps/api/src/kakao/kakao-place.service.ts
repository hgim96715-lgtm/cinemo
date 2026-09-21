import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../config/env.keys';
import { KakaoCinemaPlaceDto } from './dto/kakao-cinema-place.dto';
import { KakaoPlaceResponseDto } from './dto/kakao-place-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { REGION_ALIASES } from './constants/region-aliases';
import { CINEMA_SEARCH_TERMS } from './constants/cinema-search-terms';

@Injectable()
export class KakaoPlaceService {
  private readonly kakaoLocalBaseUrl = 'https://dapi.kakao.com/v2/local';

  private readonly keywordSearchPath = '/search/keyword.json';

  private readonly kakaoRestApiKey: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.kakaoRestApiKey = this.configService.getOrThrow<string>(
      EnvKeys.KAKAO_REST_API_KEY,
    );
  }

  async searchCinemasByRegion(region: string): Promise<KakaoCinemaPlaceDto[]> {
    const normalizedRegion = region.trim();
    if (!normalizedRegion) {
      return [];
    }

    const keyword = `${normalizedRegion} 영화관`;
    const places = new Map<string, KakaoCinemaPlaceDto>();
    let page = 1;
    while (page <= 45) {
      const response = await this.fetchKeywordPage(keyword, page);
      for (const place of response.documents) {
        if (!place.category_name.includes('영화관')) {
          continue;
        }
        const longitude = Number(place.x);
        const latitude = Number(place.y);
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
          continue;
        }
        places.set(place.id, {
          kakaoId: place.id,
          name: place.place_name,
          category: place.category_name,
          address: place.address_name,
          roadAddress: place.road_address_name || null,
          placeUrl: place.place_url || null,
          longitude,
          latitude,
        });
      }
      if (response.meta.is_end || page >= response.meta.pageable_count) {
        break;
      }
      page += 1;
    }
    return [...places.values()];
  }

  private async fetchKeywordPage(
    keyword: string,
    page: number,
  ): Promise<KakaoPlaceResponseDto> {
    const url = new URL(`${this.kakaoLocalBaseUrl}${this.keywordSearchPath}`);
    url.searchParams.set('query', keyword);
    url.searchParams.set('category_group_code', 'CT1');
    url.searchParams.set('size', '15');
    url.searchParams.set('page', String(page));

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `KakaoAK ${this.kakaoRestApiKey}`,
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `카카오 장소 검색에 실패했어요. (HTTP ${response.status})`,
      );
    }
    return (await response.json()) as KakaoPlaceResponseDto;
  }

  async syncCinemasByRegion(regionName: string): Promise<number> {
    const region = await this.prisma.region.findUnique({
      where: {
        name: regionName.trim(),
      },
      include: {
        districts: {
          select: { addressName: true },
        },
      },
    });
    if (!region) {
      throw new NotFoundException(`'${regionName}' 지역을 찾을 수 없습니다.`);
    }

    const aliases = REGION_ALIASES[region.name] ?? [region.name];
    const cinemaMap = new Map<string, KakaoCinemaPlaceDto>();

    for (const district of region.districts) {
      for (const searchTerm of CINEMA_SEARCH_TERMS) {
        const searchRegion = searchTerm
          ? `${district.addressName} ${searchTerm}`
          : district.addressName;

        const searchResults = await this.searchCinemasByRegion(searchRegion);

        for (const cinema of searchResults) {
          const addresses = [cinema.address, cinema.roadAddress]
            .filter(Boolean)
            .map((address) => address!.trim());

          const isSameRegion = addresses.some((address) =>
            aliases.some((alias) => address.startsWith(alias)),
          );

          if (isSameRegion) {
            cinemaMap.set(cinema.kakaoId, cinema);
          }
        }
      }
    }
    const cinemas = [...cinemaMap.values()];

    if (cinemas.length === 0) {
      return 0;
    }

    const kakaoIds = cinemas.map((cinema) => cinema.kakaoId);

    await this.prisma.$transaction(
      [
        this.prisma.cinema.deleteMany({
          where: {
            regionId: region.id,
            kakaoId: {
              notIn: kakaoIds,
            },
          },
        }),

        ...cinemas.map((cinema) =>
          this.prisma.cinema.upsert({
            where: {
              kakaoId: cinema.kakaoId,
            },
            create: {
              kakaoId: cinema.kakaoId,
              regionId: region.id,
              districtId: null,
              brand: cinema.category.split('>').at(-1)?.trim() || null,
              name: cinema.name,
              category: cinema.category,
              address: cinema.address,
              roadAddress: cinema.roadAddress,
              placeUrl: cinema.placeUrl,
              latitude: cinema.latitude,
              longitude: cinema.longitude,
            },
            update: {
              regionId: region.id,
              brand: cinema.category.split('>').at(-1)?.trim() || null,
              name: cinema.name,
              category: cinema.category,
              address: cinema.address,
              roadAddress: cinema.roadAddress,
              placeUrl: cinema.placeUrl,
              latitude: cinema.latitude,
              longitude: cinema.longitude,
              syncedAt: new Date(),
            },
          }),
        ),
      ],
      {
        timeout: 30_000,
      },
    );
    return cinemas.length;
  }
}
