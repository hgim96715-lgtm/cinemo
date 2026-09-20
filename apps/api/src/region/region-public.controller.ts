import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { LegalDongQueryDto } from './dto/legal-dong-query.dto';
import { LegalDongAreaResponseDto } from './dto/legal-dong-area-response.dto';
import { RegionResponseDto } from './dto/region-response.dto';
import { RegionService } from './region.service';

@ApiTags('regions')
@Public()
@Controller('regions')
export class RegionPublicController {
  constructor(private readonly regionService: RegionService) {}

  @Get('legal-dongs')
  @ApiOperation({ summary: '법정동 지역 목록 조회' })
  @ApiOkResponse({ type: [LegalDongAreaResponseDto] })
  findLegalDongAreas(@Query() dto: LegalDongQueryDto) {
    return this.regionService.findLegalDongAreas(dto);
  }

  @Get()
  @ApiOperation({ summary: '지역 및 구·군 목록 조회' })
  @ApiOkResponse({ type: [RegionResponseDto] })
  findRegions() {
    return this.regionService.findRegions();
  }
}
