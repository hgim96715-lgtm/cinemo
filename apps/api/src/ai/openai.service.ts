import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  IAiProvider,
  MovieQuoteSuggestion,
  RecommendMovieQuotesInput,
} from './ai.interface';
import { EnvKeys } from '../config/env.keys';

const movieQuoteSchema = {
  type: 'object',
  properties: {
    quotes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalText: {
            type: 'string',
          },
          koreanText: {
            type: 'string',
          },
          originalLanguage: {
            type: 'string',
          },
          isPopular: {
            type: 'boolean',
          },
          source: {
            type: ['string', 'null'],
          },
        },
        required: [
          'originalText',
          'koreanText',
          'originalLanguage',
          'isPopular',
          'source',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['quotes'],
  additionalProperties: false,
} as const;

@Injectable()
export class OpenAiService implements IAiProvider {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>(EnvKeys.OPENAI_KEY),
    });
    this.model =
      this.configService.get<string>(EnvKeys.OPENAI_MODEL) ?? 'gpt-5-mini';
  }
  private getOutputText(response: { output_text?: string }): string | null {
    const text = response.output_text?.trim();
    return text || null;
  }

  async translateOverview(
    titleEn: string,
    overviewEn: string,
  ): Promise<string | null> {
    try {
      const response = await this.openai.responses.create({
        model: this.model,
        input:
          `영화 "${titleEn}"의 영어 줄거리를 한국어로 충실하게 번역해줘.\n` +
          `요약하거나 새로 창작하지 말고, 등장인물·인물 관계·배경·사건·갈등·목표·위협 등 원문에 있는 정보를 빠뜨리지 마.\n` +
          `자연스러운 2~4문장으로 작성하되, 원문이 짧으면 없는 내용을 추가하지 마.\n` +
          `번역문만 출력해. 설명, 제목, 따옴표, 부연은 출력하지 마.\n\n` +
          overviewEn,
      });
      return this.getOutputText(response);
    } catch (error) {
      this.logger.warn(
        `translateOverview 실패 (${titleEn}): ${(error as Error).message}`,
      );
      return null;
    }
  }
  async koreanTitle(titleEn: string, year: string): Promise<string | null> {
    try {
      const response = await this.openai.responses.create({
        model: this.model,
        input:
          `영화 "${titleEn}" (${year})의 한국 개봉 제목 또는 통용 한국어 표기를 알려줘.\n` +
          `제목만 출력해. 설명, 따옴표, 부연 일절 없이.`,
      });

      const text = this.getOutputText(response);

      if (
        !text ||
        text.length > 40 ||
        /죄송|알 수 없|확인|모르|없어/.test(text)
      ) {
        return null;
      }

      return text;
    } catch (error) {
      this.logger.warn(
        `koreanTitle 실패 (${titleEn}): ${(error as Error).message}`,
      );

      return null;
    }
  }
  async koreanDirector(name: string): Promise<string | null> {
    try {
      const response = await this.openai.responses.create({
        model: this.model,
        input:
          `영화 감독 "${name}"의 한국어 표기(한글)를 알려줘.\n` +
          `한글 이름만 출력해. 설명, 따옴표, 부연 일절 없이.`,
      });

      const text = this.getOutputText(response);

      if (!text || text.length > 20 || /죄송|알 수 없|모르|없어/.test(text)) {
        return null;
      }

      return text;
    } catch (error) {
      this.logger.warn(
        `koreanDirector 실패 (${name}): ${(error as Error).message}`,
      );

      return null;
    }
  }

  async recommendMovieQuotes(
    input: RecommendMovieQuotesInput,
  ): Promise<MovieQuoteSuggestion[]> {
    const response = await this.openai.responses.create({
      model: this.model,
      input: `
  영화에 실제로 등장한 짧은 명대사만 추천함.

  영화 제목: ${input.title}
  개봉 연도: ${input.releaseYear ?? '알 수 없음'}
  줄거리: ${input.overview ?? '없음'}

  조건:
  - 영화 속 실제 대사로 알려진 문장만 작성함
  - 분위기에 맞춰 새로 만든 문장은 제외함
  - 원문과 자연스러운 한국어 번역을 함께 작성함
  - 외국 영화면 원문 언어를 유지함
  - 한국 영화면 originalText와 koreanText를 동일하게 작성함
  - 확인되지 않은 출처는 source에 null을 사용함
  - 인기 여부를 확실히 알 수 없으면 isPopular는 false로 작성함
  - 3개 이내로 작성함
  `,
      text: {
        format: {
          type: 'json_schema',
          name: 'movie_quote_suggestions',
          strict: true,
          schema: movieQuoteSchema,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as {
      quotes: MovieQuoteSuggestion[];
    };

    return parsed.quotes;
  }
}
