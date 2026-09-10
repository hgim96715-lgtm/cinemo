import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { EnvKeys } from '../config/env.keys';
import type {
  IAiProvider,
  MovieQuoteSuggestion,
  RecommendMovieQuotesInput,
} from './ai.interface';

type MovieQuoteResponse = {
  quotes?: unknown;
};

function parseMovieQuoteResponse(text: string): MovieQuoteSuggestion[] {
  const normalized = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstObject = normalized.indexOf('{');
  const lastObject = normalized.lastIndexOf('}');
  const jsonText =
    firstObject >= 0 && lastObject > firstObject
      ? normalized.slice(firstObject, lastObject + 1)
      : normalized;

  const parsed = JSON.parse(jsonText) as MovieQuoteResponse;

  if (!Array.isArray(parsed.quotes)) {
    return [];
  }

  return parsed.quotes.flatMap((quote): MovieQuoteSuggestion[] => {
    if (!quote || typeof quote !== 'object') {
      return [];
    }

    const candidate = quote as Partial<MovieQuoteSuggestion>;

    if (
      typeof candidate.originalText !== 'string' ||
      !candidate.originalText.trim() ||
      typeof candidate.koreanText !== 'string' ||
      !candidate.koreanText.trim()
    ) {
      return [];
    }

    return [
      {
        originalText: candidate.originalText.trim(),
        koreanText: candidate.koreanText.trim(),
        originalLanguage:
          typeof candidate.originalLanguage === 'string'
            ? candidate.originalLanguage
            : 'unknown',
        isPopular: candidate.isPopular === true,
        source: typeof candidate.source === 'string' ? candidate.source : null,
      },
    ];
  });
}

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
    try {
      const message = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 2400,
        temperature: 0.4,
        system:
          '너는 CINEMO의 영화 엽서 문구 추천 도우미다. ' +
          '응답은 반드시 유효한 JSON 객체 하나만 반환한다. ' +
          '설명, 인사말, 마크다운 코드 블록, 사과 문구를 JSON 바깥에 작성하지 않는다.',
        messages: [
          {
            role: 'user',
            content: `
아래에 지정한 영화의 POSTCARD에 사용할 짧고 인상적인 대사 후보를 최대 6개 추천한다.
후보는 영화와의 연결성, 대사의 완결성, 엽서 문구로서의 적합성을 기준으로 좋은 순서부터 정렬한다.
각 originalText는 90자 이내의 짧은 발췌로 작성한다.

영화 제목: ${input.title}
영화 원제: ${input.originalTitle ?? '알 수 없음'}
TMDB 영화 ID: ${input.tmdbId}
원문 언어 코드: ${input.originalLanguage ?? '알 수 없음'}
개봉 연도: ${input.releaseYear ?? '알 수 없음'}
줄거리: ${input.overview ?? '없음'}

반드시 지킬 규칙:
- 반드시 위에 지정한 영화의 대사만 작성한다.
- 제목이 같은 영화가 여러 편일 수 있으므로 TMDB 영화 ID, 개봉 연도, 원제, 줄거리를 함께 기준으로 삼는다.
- 제목이 모호하다는 이유만으로 quotes를 빈 배열로 반환하지 말고, 위 메타데이터로 특정되는 작품의 후보만 추천한다.
- 다른 영화의 대사, 배우의 다른 작품 대사, 인터넷에서 유명하지만 영화가 불확실한 대사는 절대 포함하지 않는다.
- 해당 영화와 연결이 분명한 대표 대사나 짧은 대사 발췌를 우선 추천한다.
- 실시간 검색으로 출처를 확인할 수 없다는 이유만으로 quotes를 빈 배열로 반환하지 않는다.
- 긴 대사는 엽서에 넣을 수 있는 짧은 완결 구절로 발췌한다.
- originalText에는 영화의 원문 언어로 된 짧은 대사 발췌를 작성한다.
- originalText는 반드시 영화의 원문 언어로 작성한다. 영어로 임의 번역하거나 영어 대사로 바꾸지 않는다.
- 원문 언어 코드가 ja면 일본어, ko면 한국어, fr면 프랑스어 등 해당 언어를 유지한다.
- koreanText에는 originalText 전체의 자연스러운 한국어 번역을 작성한다.
- originalText와 koreanText의 문장 범위와 의미가 일치해야 한다.
- 영화에서 실제 대사로 알려졌거나, 모델의 지식상 해당 영화와 연결이 충분히 분명한 대사만 추천한다.
- 영화 분위기만으로 새로 창작하지 않는다.
- 출처를 확인하기 어려우면 source는 null로 반환한다.
- 영화와 전혀 연결되지 않는 경우에만 설명 없이 quotes를 빈 배열로 반환한다.
- 다른 영화 제목이나 다른 작품의 설명을 응답에 포함하지 않는다.

아래 JSON 형식만 반환한다. 키 이름을 바꾸거나 누락하지 않는다.
{
  "quotes": [
    {
      "originalText": "영화 속 원문 전체",
      "koreanText": "원문 전체의 한국어 번역",
      "originalLanguage": "원문의 언어",
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

      try {
        return parseMovieQuoteResponse(textBlock.text);
      } catch {
        this.logger.warn('AI 응답에서 유효한 영화 대사 JSON을 추출하지 못함');
        return [];
      }
    } catch (error) {
      this.logger.warn(
        `recommendMovieQuotes 실패 (${input.title}): ${(error as Error).message}`,
      );
      return [];
    }
  }
}
