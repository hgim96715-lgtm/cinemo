import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get(':nickname')
  getProfile(@Param('nickname') nickname: string) {
    return this.authService.getPublicProfile(nickname);
  }
}
