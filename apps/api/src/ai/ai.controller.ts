import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { RecommendMovieQuotesDto } from './dto/recommend-movie-quotes.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('quote-suggestions')
  recommendMovieQuotes(@Body() input: RecommendMovieQuotesDto) {
    return this.aiService.recommendMovieQuotes(input);
  }
}
