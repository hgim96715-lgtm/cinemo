import { Controller, HttpStatus, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegionService } from './region.service';
import { LegalDongSyncResponseDto } from './dto/legal-dong-sync-response.dto';
import { RegionSyncResponseDto } from './dto/region-sync-response.dto';

@ApiBearerAuth()
@Roles('admin')
@Controller('admin/regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post('sync')
  @ApiOperation({ summary: '법정동 코드 동기화' })
  @ApiOkResponse({ type: LegalDongSyncResponseDto })
  syncRegions() {
    return this.regionService.syncLegalDongCodes();
  }

  @Post('sync-regions-and-districts')
  @ApiOperation({ summary: '법정동 데이터를 Region·District로 동기화' })
  @ApiOkResponse({ type: RegionSyncResponseDto })
  syncRegionsAndDistricts() {
    return this.regionService.syncRegionsAndDistricts();
  }
}
