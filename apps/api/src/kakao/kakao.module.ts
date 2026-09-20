import { Module } from '@nestjs/common';
import { KakaoPlaceService } from './kakao-place.service';
import { KakaoPlaceController } from './kakao-place.controller';

@Module({
  controllers: [KakaoPlaceController],
  providers: [KakaoPlaceService],
})
export class KakaoModule {}
