import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CinemaService {
  constructor(private readonly prisma: PrismaService) {}

  async findCinemasByRegion(regionName: string) {
    return this.prisma.cinema.findMany({
      where: {
        region: {
          name: regionName.trim(),
        },
      },
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
    });
  }
}
