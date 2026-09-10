import { Module } from '@nestjs/common';
import { PostcardService } from './postcard.service';
import { PostcardController } from './postcard.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [PostcardController],
  providers: [PostcardService],
  exports: [PostcardService],
})
export class PostcardModule {}
