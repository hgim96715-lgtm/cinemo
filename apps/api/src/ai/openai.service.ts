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
  영화의 POSTCARD에 사용할 짧고 인상적인 대사 후보를 최대 6개 추천함.
  영화와의 연결성, 대사의 완결성, 엽서 문구로서의 적합성을 기준으로 좋은 순서부터 정렬함.
  originalText는 90자 이내의 짧은 발췌로 작성함.

  영화 제목: ${input.title}
  영화 원제: ${input.originalTitle ?? '알 수 없음'}
  TMDB 영화 ID: ${input.tmdbId}
  원문 언어 코드: ${input.originalLanguage ?? '알 수 없음'}
  개봉 연도: ${input.releaseYear ?? '알 수 없음'}
  줄거리: ${input.overview ?? '없음'}

  조건:
  - 제목이 같은 영화가 여러 편이면 TMDB 영화 ID·개봉 연도·원제·줄거리로 작품을 구분함
  - 제목이 모호하다는 이유만으로 빈 배열을 반환하지 말고, 위 메타데이터로 특정되는 작품의 후보만 작성함
  - 해당 영화와 연결이 분명한 대표 대사나 짧은 대사 발췌를 우선 작성함
  - 긴 대사는 엽서에 넣을 수 있는 짧은 완결 구절로 발췌함
  - 영화 분위기에 맞춰 새로 만든 문장은 제외함
  - 원문과 자연스러운 한국어 번역을 함께 작성함
  - originalText는 영화의 원문 언어를 유지하고 영어로 임의 변경하지 않음
  - 외국 영화면 원문 언어를 유지함
  - 한국 영화면 originalText와 koreanText를 동일하게 작성함
  - 확인되지 않은 출처는 source에 null을 사용함
  - 인기 여부를 확실히 알 수 없으면 isPopular는 false로 작성함
  - 영화와 전혀 연결되지 않는 경우에만 quotes를 빈 배열로 반환함
  - 최대 6개까지 작성함
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
