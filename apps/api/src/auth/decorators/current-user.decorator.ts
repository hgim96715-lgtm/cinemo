import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SocialProfile } from '../types/social-profile.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SocialProfile => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as SocialProfile;
  },
);
