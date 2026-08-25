import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  GACHA_MACHINES,
  GACHA_TMDB_FILTERS,
  isGachaMachineId,
} from '@cinemo/shared';
import { TmdbService } from './tmdb.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { UpsertProviderOverrideDto } from './dto/upsert-provider-override.dto';
import { SeedRunService } from './seed-run.service';

@ApiTags('tmdb')
@ApiBearerAuth()
@Controller('tmdb')
export class TmdbController {
  constructor(
    private readonly tmdbService: TmdbService,
    private readonly seedRunService: SeedRunService,
  ) {}

  private getFilters(machineId?: string) {
    return machineId && isGachaMachineId(machineId)
      ? GACHA_TMDB_FILTERS[machineId]
      : {};
  }

  @Get('genres')
  @ApiQuery({ name: 'language', required: false, example: 'ko' })
  getMovieGenres(@Query('language') language?: string) {
    return this.tmdbService.getMovieGenres(language ?? 'ko');
  }

  @Get('discover')
  @ApiQuery({
    name: 'machineId',
    required: false,
    example: 'thriller',
    description:
      'genre: random|thriller|action|comedy|romance|horror|sf|drama · country: kr|jp|us|fr|gb|cn|de|in',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  discover(
    @Query('machineId') machineId: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.discoverMovies(this.getFilters(machineId), page);
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true, example: '인셉션' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  search(
    @Query('q') q: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.tmdbService.searchMovies(q, page);
  }

  @Roles('admin')
  @Get('seed-pool/latest')
  async getLatestSeedPool() {
    const latest = await this.seedRunService.getLatest();
    return { run: latest };
  }

  @Roles('admin')
  @Get('seed-pool/progress')
  getSeedPoolProgress() {
    return {
      progress: this.tmdbService.getSeedProgress(),
    };
  }

  @Roles('admin')
  @Post('seed-pool')
  @ApiQuery({
    name: 'machineId',
    required: false,
    example: 'thriller',
    description:
      'genre: random|thriller|action|comedy|romance|horror|sf|drama · country: kr|jp|us|fr|gb|cn|de|in',
  })
  @ApiQuery({ name: 'pages', required: false, example: 3 })
  seedPool(
    @Query('machineId') machineId: string | undefined,
    @Query('pages', new DefaultValuePipe(5), ParseIntPipe) pages: number,
  ) {
    return this.seedRunService.executeSingle('manual', pages, 1, () =>
      this.tmdbService.seedPool(this.getFilters(machineId), pages),
    );
  }

  @Roles('admin')
  @Post('seed-pool/all')
  @ApiQuery({ name: 'pages', required: false, example: 10 })
  seedPoolAll(
    @Query('pages', new DefaultValuePipe(10), ParseIntPipe) pages: number,
  ) {
    return this.seedRunService.execute(
      'manual',
      pages,
      Object.keys(GACHA_TMDB_FILTERS).length,
      () => this.tmdbService.seedPoolAll(pages),
    );
  }

  @Public()
  @Post('seed-pool/cron')
  @ApiQuery({ name: 'pages', required: false, example: 3 })
  seedPoolCron(
    @Headers('x-cron-secret') secret: string | undefined,
    @Query('pages', new DefaultValuePipe(3), ParseIntPipe) pages: number,
  ) {
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('잘못된 cron secret입니다.');
    }

    return this.seedRunService.execute(
      'cron',
      pages,
      GACHA_MACHINES.length,
      () => this.tmdbService.seedPoolAll(pages),
    );
  }

  @Roles('admin')
  @Post('seed-pool/cancel')
  cancelSeedPool() {
    return {
      cancelled: this.tmdbService.requestSeedCancel(),
    };
  }

  @Roles('admin')
  @Get('provider-overrides')
  listProviderOverrides(@Query('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.tmdbService.listProviderOverrides(tmdbId);
  }

  @Roles('admin')
  @Post('provider-overrides')
  upsertProviderOverride(
    @UserId() userId: string,
    @Body() dto: UpsertProviderOverrideDto,
  ) {
    return this.tmdbService.upsertProviderOverride(userId, dto);
  }
}
