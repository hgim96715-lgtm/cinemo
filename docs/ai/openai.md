# OpenAI Provider

OpenAI Responses API를 사용하는 교체 가능한 Provider.

현재 `AiModule`에서는 주입이 주석 처리되어 있어 기본 Provider로 사용하지 않음.

## 기본 정보

| 항목 | 내용 |
| --- | --- |
| 구현체 | `OpenAiService` |
| SDK | `openai` |
| 호출 방식 | `openai.responses.create()` |
| 환경 변수 | `OPENAI_KEY`, `OPENAI_MODEL` |
| 기본 모델 | `gpt-5-mini` |
| 활성화 위치 | `apps/api/src/ai/ai.module.ts` |

## 현재 등록 상태

```ts
{ provide: AI_PROVIDER, useClass: ClaudeService },
// { provide: AI_PROVIDER, useClass: OpenAiService },
```

OpenAI로 교체할 때는 Claude 등록을 제거하거나 주석 처리하고 OpenAI 등록을 활성화함. 두 Provider를 같은 토큰에 동시에 등록하지 않음.

## Claude와 구현 차이

| 구분 | Claude | OpenAI |
| --- | --- | --- |
| 요청 | `messages.create()` | `responses.create()` |
| 입력 | `messages` 배열 | `input` 문자열 또는 입력 배열 |
| 텍스트 추출 | `content`의 `text` block | `response.output_text` |
| 구조화 응답 | 프롬프트와 직접 파싱 | `text.format.json_schema` |
| Provider | `ClaudeService` | `OpenAiService` |

## Structured Outputs

명대사 추천은 OpenAI Responses API의 JSON Schema를 사용해 `quotes` 배열 구조를 제한함.

```mermaid
flowchart LR
  Input[영화 제목·줄거리] --> Schema[JSON Schema]
  Schema --> Responses[Responses API]
  Responses --> Output[output_text]
  Output --> Decode[JSON decoding]
  Decode --> Validate[런타임 타입 검증]
  Validate --> Result[MovieQuoteSuggestion[]]
```

Structured Outputs가 보장하는 것은 JSON 구조임. 영화 대사의 실제 존재 여부, 인기도, 출처까지 보장하지 않음. `isPopular`와 `source`는 별도 검증 대상.

## 교체 절차

1. `OPENAI_KEY`와 선택적 `OPENAI_MODEL` 등록
2. `apps/api/src/ai/ai.module.ts`에서 `OpenAiService` 활성화
3. `OpenAiService`의 API 응답·JSON 파싱 확인
4. API 타입 검사 실행
5. 영화 정보 보완과 엽서 문구 추천을 각각 테스트

```env
OPENAI_KEY=
OPENAI_MODEL=gpt-5-mini
```

OpenAI API 키는 API 서버 환경 변수에만 저장함. Web 환경 변수에 넣지 않음.
