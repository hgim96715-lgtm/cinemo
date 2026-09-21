import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EnvKeys } from '../config/env.keys';
import { LegalDongResponseDto } from './dto/legal-dong-response.dto';
import { LegalDongQueryDto } from './dto/legal-dong-query.dto';
import { LegalDongRowDto } from './dto/legal-dong-row.dto';
import { LegalDongSyncResponseDto } from './dto/legal-dong-sync-response.dto';
import { RegionSyncResponseDto } from './dto/region-sync-response.dto';

@Injectable()
export class RegionService {
  private readonly serviceKey: string;
  private readonly PAGE_SIZE = 1000;
  private readonly ADMINISTRATIVE_REGION_API_URL =
    'https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.serviceKey = this.configService.getOrThrow<string>(
      EnvKeys.DATA_GO_KR_SERVICE_KEY,
    );
  }
  private assertLegalDongResponse(data: LegalDongResponseDto): void {
    const headSection = data.StanReginCd?.find((section) => section.head);

    const result = headSection?.head?.find((item) => item.RESULT)?.RESULT;

    if (result?.resultCode !== 'INFO-0') {
      throw new InternalServerErrorException(
        `법정동 코드 API 에러 [${result?.resultCode ?? 'UNKNOWN'}]: ${
          result?.resultMsg ?? '응답 형식이 올바르지 않아요.'
        }`,
      );
    }
  }

  private async fetchLegalDongPage(
    pageNo: number,
  ): Promise<LegalDongResponseDto> {
    const url = new URL(this.ADMINISTRATIVE_REGION_API_URL);

    url.searchParams.set('ServiceKey', this.serviceKey);
    url.searchParams.set('type', 'json');
    url.searchParams.set('pageNo', String(pageNo));
    url.searchParams.set('numOfRows', String(this.PAGE_SIZE));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `법정동 코드 API 요청에 실패했어요. (HTTP ${response.status})`,
      );
    }

    const data = (await response.json()) as LegalDongResponseDto;

    this.assertLegalDongResponse(data);

    return data;
  }

  async fetchAllLegalDongRows(): Promise<LegalDongRowDto[]> {
    const firstPage = await this.fetchLegalDongPage(1);
    const head =
      firstPage.StanReginCd?.find((section) => section.head)?.head ?? [];
    const totalCount = head.find((item) => item.totalCount)?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / this.PAGE_SIZE);
    const rows: LegalDongRowDto[] = [];

    for (let pageNo = 1; pageNo <= totalPages; pageNo += 1) {
      const page = await this.fetchLegalDongPage(pageNo);

      const rowSection = page.StanReginCd?.find((section) => section.row);

      rows.push(...(rowSection?.row ?? []));
    }
    return rows;
  }

  private async upsertLegalDongs(rows: LegalDongRowDto[]): Promise<number> {
    const batchSize = 1000;

    for (let index = 0; index < rows.length; index += batchSize) {
      const batch = rows.slice(index, index + batchSize);

      await this.prisma.legalDong.createMany({
        data: batch.map((row) => ({
          regionCode: row.region_cd,
          sidoCode: row.sido_cd,
          sigunguCode: row.sgg_cd,
          eupmyeondongCode: row.umd_cd,
          riCode: row.ri_cd,
          residentCode: row.locatjumin_cd,
          landCode: row.locatjijuk_cd,
          addressName: row.locatadd_nm,
          order: row.locat_order,
          remark: row.locat_rm || null,
          upperCode: row.locathigh_cd,
          lowestName: row.locallow_nm,
          effectiveDate: row.adpt_de || null,
        })),
        skipDuplicates: true,
      });
    }

    return rows.length;
  }

  async syncLegalDongCodes(): Promise<LegalDongSyncResponseDto> {
    const rows = await this.fetchAllLegalDongRows();
    const syncedCount = await this.upsertLegalDongs(rows);

    return { syncedCount };
  }

  async findLegalDongAreas(dto: LegalDongQueryDto) {
    const { sidoCode, limit } = dto;
    return this.prisma.legalDong.findMany({
      where: {
        ...(sidoCode ? { sidoCode } : {}),
        eupmyeondongCode: '000',
        riCode: '00',
      },
      take: limit,
      select: {
        regionCode: true,
        sidoCode: true,
        sigunguCode: true,
        lowestName: true,
        addressName: true,
      },
      orderBy: [{ sidoCode: 'asc' }, { sigunguCode: 'asc' }, { order: 'asc' }],
    });
  }

  async findRegions() {
    return this.prisma.region.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        addressName: true,
        centerLatitude: true,
        centerLongitude: true,
        zoom: true,
        districts: {
          orderBy: {
            name: 'asc',
          },
          select: {
            id: true,
            name: true,
            centerLatitude: true,
            centerLongitude: true,
            addressName: true,
            zoom: true,
          },
        },
      },
    });
  }

  async syncRegionsAndDistricts(): Promise<RegionSyncResponseDto> {
    const areas = await this.prisma.legalDong.findMany({
      where: {
        eupmyeondongCode: '000',
        riCode: '00',
      },
      select: {
        regionCode: true,
        sidoCode: true,
        sigunguCode: true,
        lowestName: true,
        addressName: true,
      },
      orderBy: [{ sidoCode: 'asc' }, { sigunguCode: 'asc' }],
    });

    const regionIdBySidoCode = new Map<string, string>();

    const regionAreas = areas.filter(
      ({ sigunguCode }) => sigunguCode === '000',
    );

    const districtAreas = areas.filter(
      ({ sigunguCode }) => sigunguCode !== '000',
    );

    let districtsCount = 0;

    for (const area of regionAreas) {
      const region = await this.prisma.region.upsert({
        where: {
          name: area.lowestName,
        },
        create: {
          name: area.lowestName,
          addressName: area.addressName,
        },
        update: {
          addressName: area.addressName,
        },
        select: {
          id: true,
        },
      });
      regionIdBySidoCode.set(area.sidoCode, region.id);
    }

    for (const area of districtAreas) {
      const regionId = regionIdBySidoCode.get(area.sidoCode);

      if (!regionId) {
        continue;
      }

      await this.prisma.district.upsert({
        where: {
          regionId_name: {
            regionId,
            name: area.lowestName,
          },
        },
        create: {
          regionId,
          name: area.lowestName,
          addressName: area.addressName,
        },
        update: {
          addressName: area.addressName,
        },
      });

      districtsCount += 1;
    }

    return {
      regionsCount: regionIdBySidoCode.size,
      districtsCount,
    };
  }
}
