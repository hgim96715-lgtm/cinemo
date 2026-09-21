import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CinemaPageResponseDto } from './dto/cinema-page-response.dto';
import { CinemaAnalysisResponseDto } from './dto/cinema-analysis-response.dto';

@Injectable()
export class CinemaService {
  constructor(private readonly prisma: PrismaService) {}

  async findCinemasByRegion(
    regionName?: string,
    page = 1,
    pageSize = 20,
  ): Promise<CinemaPageResponseDto> {
    const region = regionName?.trim();
    const where = region
      ? {
          region: {
            name: region,
          },
        }
      : undefined;

    const [items, totalCount] = await Promise.all([
      this.prisma.cinema.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          kakaoId: true,
          brand: true,
          name: true,
          category: true,
          address: true,
          roadAddress: true,
          placeUrl: true,
          latitude: true,
          longitude: true,
          regionId: true,
          districtId: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.cinema.count({ where }),
    ]);

    return {
      items,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async searchCinemas(query: string) {
    const keyword = query.trim();

    return this.prisma.cinema.findMany({
      where: {
        OR: [
          {
            name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            brand: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            address: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            roadAddress: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 50,
      orderBy: {
        name: 'asc',
      },
    });
  }
  async findCinemaAnalysis(): Promise<CinemaAnalysisResponseDto> {
    const [totalCount, regionGroups, brandGroups] = await Promise.all([
      this.prisma.cinema.count(),
      this.prisma.cinema.groupBy({
        by: ['regionId'],
        _count: {
          _all: true,
        },
      }),
      this.prisma.cinema.groupBy({
        by: ['brand'],
        _count: {
          _all: true,
        },
      }),
    ]);
    const regionRecords = await this.prisma.region.findMany({
      where: {
        id: {
          in: regionGroups.map((group) => group.regionId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const regionNameById = new Map(
      regionRecords.map((region) => [region.id, region.name]),
    );

    const regions = regionGroups
      .map((group) => ({
        name: regionNameById.get(group.regionId) ?? '알 수 없음',
        count: group._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    const brands = Object.entries(
      brandGroups.reduce<Record<string, number>>((counts, group) => {
        const brandName =
          group.brand?.trim() && group.brand !== '영화관'
            ? group.brand
            : '기타';

        counts[brandName] = (counts[brandName] ?? 0) + group._count._all;

        return counts;
      }, {}),
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return {
      totalCount,
      regions,
      brands,
    };
  }
}
