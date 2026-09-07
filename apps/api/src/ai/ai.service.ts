import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, type IAiProvider } from './ai.interface';

@Injectable()
export class AiService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: IAiProvider) {}

  translateOverview(titleEn: string, overviewEn: string) {
    return this.aiProvider.translateOverview(titleEn, overviewEn);
  }

  koreanTitle(titleEn: string, year: string) {
    return this.aiProvider.koreanTitle(titleEn, year);
  }

  koreanDirector(name: string) {
    return this.aiProvider.koreanDirector(name);
  }

  recommendMovieQuotes(
    input: Parameters<IAiProvider['recommendMovieQuotes']>[0],
  ) {
    return this.aiProvider.recommendMovieQuotes(input);
  }
}
