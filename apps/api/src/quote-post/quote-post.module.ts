import { Module } from '@nestjs/common';
import { QuotePostService } from './quote-post.service';
import { QuotePostController } from './quote-post.controller';
import { TmdbModule } from '../tmdb/tmdb.module';

@Module({
  imports: [TmdbModule],
  controllers: [QuotePostController],
  providers: [QuotePostService],
  exports: [QuotePostService],
})
export class QuotePostModule {}
