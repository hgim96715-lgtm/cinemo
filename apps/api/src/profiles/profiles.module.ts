import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesController } from './profiles.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProfilesController],
})
export class ProfilesModule {}
