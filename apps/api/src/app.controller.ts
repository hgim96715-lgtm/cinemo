import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API 서버 기본 응답 확인' })
  @ApiOkResponse({ type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
