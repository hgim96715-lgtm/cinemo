import { Body, Controller, Get, Patch } from '@nestjs/common';
import { GuideService } from './guide.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateLobbyGuideDto } from './dto/update-lobby-guide.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('guide')
@ApiBearerAuth()
@Controller('guide')
export class GuideController {
  constructor(private readonly guideService: GuideService) {}

  @Public()
  @Get()
  getGuide() {
    return this.guideService.getGuide();
  }

  @Roles('admin')
  @Patch()
  updateGuide(@Body() dto: UpdateLobbyGuideDto) {
    return this.guideService.updateGuide(dto);
  }
}
