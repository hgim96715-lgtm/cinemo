import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { EnvKeys } from '../config/env.keys';
import type {
  IAiProvider,
  MovieQuoteSuggestion,
  RecommendMovieQuotesInput,
} from './ai.interface';

@Injectable()
export class ClaudeService implements IAiProvider {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly claudeClient: Anthropic;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.claudeClient = new Anthropic({
      apiKey: this.configService.getOrThrow(EnvKeys.CLAUDE_KEY),
    });
    this.model =
      this.configService.get<string>(EnvKeys.CLAUDE_MODEL) ??
      'claude-haiku-4-5';
  }

  async translateOverview(
    titleEn: string,
    overviewEn: string,
  ): Promise<string | null> {
    try {
      const msg = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content:
              `영화 "${titleEn}"의 영어 줄거리를 한국어로 충실하게 번역해줘.\n` +
              `요약하거나 새로 창작하지 말고, 등장인물·인물 관계·배경·사건·갈등·목표·위협 등 원문에 있는 정보를 빠뜨리지 마.\n` +
              `자연스러운 2~4문장으로 작성하되, 원문이 짧으면 없는 내용을 추가하지 마.\n` +
              `번역문만 출력해. 설명, 제목, 따옴표, 부연은 출력하지 마.\n\n` +
              overviewEn,
          },
        ],
      });
      return msg.content.find((c) => c.type === 'text')?.text?.trim() ?? null;
    } catch (error) {
      this.logger.warn(
        `translateOverview 실패 (${titleEn}): ${(error as Error).message}`,
      );
      return null;
    }
  }

  async koreanTitle(titleEn: string, year: string): Promise<string | null> {
    try {
      const msg = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 64,
        messages: [
          {
            role: 'user',
            content:
              `영화 "${titleEn}" (${year})의 한국 개봉 제목 또는 통용 한국어 표기를 알려줘.\n` +
              `제목만 출력해. 설명, 따옴표, 부연 일절 없이.`,
          },
        ],
      });
      // 거절 문구 or 너무 긴 응답은 null로 처리
      const text =
        msg.content.find((c) => c.type === 'text')?.text?.trim() ?? null;
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
      const msg = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 32,
        messages: [
          {
            role: 'user',
            content:
              `영화 감독 "${name}"의 한국어 표기(한글)를 알려줘.\n` +
              `한글 이름만 출력해. 설명, 따옴표, 부연 일절 없이.`,
          },
        ],
      });
      const text = msg.content.find((c) => c.type === 'text')?.text?.trim();
      if (!text || text.length > 20 || /죄송|알 수 없|모르|없어/.test(text)) {
        return null;
      }
      return text;
    } catch (err) {
      this.logger.warn(
        `koreanDirector 실패 (${name}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  async recommendMovieQuotes(
    input: RecommendMovieQuotesInput,
  ): Promise<MovieQuoteSuggestion[]> {
    const message = await this.claudeClient.messages.create({
      model: this.model,
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: `
          영화에 실제로 등장한 짧은 명대사만 반환함.

          영화 제목: ${input.title}
          개봉 연도: ${input.releaseYear ?? '알 수 없음'}
          줄거리: ${input.overview ?? '없음'}

          반드시 지킬 규칙:
          - 영화 속 실제 대사라고 확신할 수 있는 문장만 작성함
          - 영화의 주제나 분위기를 요약한 문장은 작성하지 않음
          - 대사를 새로 만들거나 감성적으로 각색하지 않음
          - originalText는 실제 영화 대사의 원문을 작성함
          - koreanText는 originalText의 자연스러운 번역만 작성함
          - originalText와 koreanText의 의미가 달라지면 안 됨
          - "인생이 아름답다", "다시 시작할 수 있다"처럼 주제를 요약한 문장은 제외함
          - 실제 대사를 확인할 수 없으면 추측하지 말고 quotes를 빈 배열로 반환함
          - 출처를 확인하지 못했으면 source는 null로 작성함
          - 인기 여부를 확인하지 못했으면 isPopular는 false로 작성함
          - 최대 3개까지만 반환함

          반드시 아래 JSON만 반환함:
          {
            "quotes": [
              {
                "originalText": "영화 속 실제 원문",
                "koreanText": "원문의 자연스러운 한국어 번역",
                "originalLanguage": "English",
                "isPopular": false,
                "source": null
              }
            ]
          }
          `,
        },
      ],
    });

    const textBlock = message.content.find(
      (content) => content.type === 'text',
    );

    if (!textBlock || textBlock.type !== 'text') {
      return [];
    }
    const jsonText = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonText) as {
      quotes: MovieQuoteSuggestion[];
    };

    return parsed.quotes;
  }
}
