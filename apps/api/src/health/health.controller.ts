import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { HealthResponseDto } from './dto/health-response.dto';

@Public()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '서버 상태 확인' })
  @ApiOkResponse({ type: HealthResponseDto })
  async healthCheck(): Promise<HealthResponseDto> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}
