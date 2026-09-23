import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { RecommendMovieQuotesDto } from './dto/recommend-movie-quotes.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MovieQuoteSuggestionResponseDto } from './dto/movie-quote-suggestion-response.dto';

@ApiTags('ai')
@Controller('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('quote-suggestions')
  @ApiOperation({ summary: '영화 명대사 추천' })
  @ApiOkResponse({ type: [MovieQuoteSuggestionResponseDto] })
  recommendMovieQuotes(@Body() input: RecommendMovieQuotesDto) {
    return this.aiService.recommendMovieQuotes(input);
  }
}
