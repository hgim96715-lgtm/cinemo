import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CinemaPageResponseDto } from './dto/cinema-page-response.dto';

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
}
