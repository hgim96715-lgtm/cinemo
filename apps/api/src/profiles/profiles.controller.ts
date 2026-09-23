import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { PublicProfileResponseDto } from './dto/public-profile-response.dto';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get(':nickname')
  @ApiOkResponse({
    type: PublicProfileResponseDto,
    description: '공개 프로필 조회',
  })
  getProfile(@Param('nickname') nickname: string) {
    return this.authService.getPublicProfile(nickname);
  }
}
