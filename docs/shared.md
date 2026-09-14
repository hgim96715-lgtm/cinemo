# `@cinemo/shared`

API와 Web이 함께 사용하는 **순수 타입·상수·유틸 패키지**임.

`shared`는 CINEMO의 모든 공통 코드를 넣는 폴더가 아님. HTTP API 계약은 `packages/api-contract`, Web 공통 UI는 `apps/web/components/common`, NestJS 서버 설정은 `apps/api/src/config`에서 관리함.

## 사용하는 이유

```mermaid
flowchart LR
  Web[apps/web] --> Shared[@cinemo/shared]
  API[apps/api] --> Shared
  Shared --> Pure[순수 타입·상수·유틸]
  Contract[packages/api-contract\nOpenAPI 생성 타입] --> Web
  Contract --> API
  UI[apps/web/components/common\n공통 UI] --> Web
  Config[apps/api/src/config\n서버 설정] --> API
```

- API 응답 타입과 Web 화면 상태 타입을 한 곳에서 관리함
- 로비 방 ID처럼 양쪽에서 사용하는 상수의 불일치를 방지함
- API 변경 시 Web에서 타입 오류를 즉시 확인할 수 있음
- 실행 로직이나 DB 접근을 넣지 않고 컴파일 타임 계약만 제공함

즉, `@cinemo/shared`는 API와 Web이 함께 사용할 수 있는 순수 공통 코드 계층임. Prisma 모델을 그대로 노출하는 계층이 아니며, 화면과 API가 필요한 형태로 별도 타입을 정의함.

## 현재 CINEMO 적용 범위

현재는 모든 API 응답 타입을 한 번에 `api-contract`로 옮기지 않음.

```txt
MOVIE CHART
  → 새 API DTO에 Swagger metadata 추가
  → api-contract에서 생성 타입 사용

기존 Postcard·User Movie·Lobby 타입
  → 기존 shared 타입 유지
```

따라서 `packages/shared/src/postcard.ts`가 남아 있는 것은 누락이 아님. 기존 기능의 API/Web 공통 타입으로 계속 사용 중이며, 해당 기능을 OpenAPI 계약 기반으로 전환할 때 별도 migration을 진행함.

새 API 응답을 추가할 때는 다음 기준을 적용함.

- 새 HTTP 요청·응답 DTO: `api-contract` 우선 검토
- 이미 `shared`에서 사용 중인 타입: 호환성을 확인한 뒤 단계적으로 이동
- API와 무관한 순수 타입·상수·유틸: `shared`에 유지
- 같은 타입을 `shared`와 `api-contract`에 동시에 정의하지 않음

## 헷갈리기 쉬운 기준

`shared`에 있는 코드도 API와 Web이 실행될 때 import될 수 있음. 따라서 “실행 중 사용되는가”는 분류 기준이 아님.

판단 기준은 해당 코드가 **HTTP 전송 방식이나 특정 프레임워크에 의존하는가**임.

| 질문 | 관리 위치 |
| --- | --- |
| HTTP API 없이도 제품의 공통 개념으로 의미가 있는가? | `packages/shared` |
| 서버의 요청·응답 JSON 구조를 설명하는가? | `packages/api-contract` |
| 실제 `fetch`·axios 요청이나 캐시·인증 헤더를 처리하는가? | `packages/api-client` 또는 Web/API 내부 |
| React·NestJS·Prisma·`process.env`에 의존하는가? | 해당 애플리케이션 내부 |

```txt
shared
  = 제품의 공통 개념

api-contract
  = HTTP 데이터 형식과 API 계약

api-client
  = HTTP 통신 방법
```

예를 들어 영화 기능은 다음처럼 나눔.

```txt
영화 장르·관람 상태·로비 방 ID
  → shared

GET /v1/lobby/movie-chart의 응답 타입
  → api-contract

getMovieChart()와 fetch·인증·오류 처리
  → api-client
```

### Shared에 들어가는 실제 예시

#### 순수 상수

```ts
// packages/shared/src/index.ts
export const LOBBY_ROOMS = {
  BOX_OFFICE: 'box-office',
  GACHA: 'gacha',
} as const;
```

API endpoint나 React 화면을 몰라도 `box-office`와 `gacha`라는 제품 개념 자체는 필요하므로 `shared`에 둘 수 있음.

#### 순수 타입

```ts
// packages/shared/src/user-movie.ts
export type UserMovieKind = 'wish' | 'watched';

export type UserMovieViewingType = 'theater' | 'home' | 'other';
```

API 응답의 전체 모양이 아니라 API·Web 양쪽에서 의미를 공유하는 도메인 값임.

#### 순수 유틸

```ts
// packages/shared/src/profile.ts
export function normalizeProfileTag(raw: string): string | null {
  const text = raw.trim().replace(/^#+/, '');
  if (!text || text.length > PROFILE_TAG_MAX_LEN) return null;
  return text;
}
```

React state, NestJS provider, DB, `fetch` 없이 문자열만 받아 문자열 또는 `null`을 반환하므로 `shared`에 적합함.

다음 코드는 `shared`에 넣지 않음.

```ts
// React·HTTP·환경변수에 의존하므로 앱 또는 api-client에 둠
export async function getMovieChart() {
  const response = await fetch('/v1/lobby/movie-chart');
  return response.json();
}
```

### `postcard.ts`가 `shared`에 있는 이유

현재 `packages/shared/src/postcard.ts`에는 `PostcardItem`, `PostcardCommentItem` 같은 타입만 있음.

이 타입들은 실제로 API 응답 형태에 가깝기 때문에, OpenAPI DTO를 적용하는 최종 구조에서는 `api-contract`로 옮길 수 있는 후보임. 다만 현재 CINEMO에서는 기존 API와 Web이 이미 이 타입을 함께 사용하고 있어 호환성을 위해 `shared`에 유지 중임.

즉, 현재 상태는 다음과 같음.

```txt
새로 추가하는 HTTP API 타입
  → api-contract 우선

기존 shared 타입
  → 기능을 깨지 않도록 유지

기존 타입을 옮길 때
  → OpenAPI 생성 타입으로 사용처 교체
  → 중복이 없는지 확인
  → shared 타입 제거
```

`shared`에 있는 타입이라고 해서 모두 최종적으로 `shared`에 있어야 한다는 뜻은 아님. 기존 코드의 점진적 migration 상태까지 함께 고려해야 함.

## `shared`와 다른 계층의 구분

| 필요한 것 | 관리 위치 | 이유 |
| --- | --- | --- |
| API/Web 공통 상수·순수 타입 | `packages/shared` | 실행환경과 무관하게 양쪽에서 사용 |
| HTTP 요청·응답 타입 | `packages/api-contract` | OpenAPI 스펙에서 생성하여 서버 DTO와 동기화 |
| Web 공통 버튼·모달·네비게이션 | `apps/web/components/common` | React 실행 로직과 스타일은 Web 전용 |
| NestJS 환경변수·`registerAs` 설정 | `apps/api/src/config` | secret과 서버 실행 설정은 API 전용 |
| Prisma 모델·DB 접근 | `apps/api/prisma`, `apps/api/src/prisma` | 데이터베이스 구현은 API 내부에 캡슐화 |

### 넣지 않는 것

- Controller·Service·Prisma Client 같은 실행 로직
- `process.env`와 secret
- React 컴포넌트·CSS
- Swagger DTO에서 생성되는 HTTP 응답 타입
- 특정 애플리케이션에서만 사용하는 페이지 전용 타입

## 위치

```txt
packages/shared/src/
  index.ts
  admin.ts
  avatar.ts
  gacha.ts
  guide.ts
  lobby-board.ts
  postcard.ts
  profile.ts
  user-movie.ts
```

## 주요 공유 타입

| 파일 | 역할 |
|---|---|
| `gacha.ts` | 뽑기 머신·장르·국가 타입 |
| `user-movie.ts` | wish/watched, 관람 상세, 달력·통계 응답 |
| `lobby-board.ts` | 로비 전광판·박스오피스 |
| `profile.ts` | 프로필·태그 |
| `avatar.ts` | 아바타 구성 |
| `guide.ts` | 가입 직후 로비 가이드 |
| `admin.ts` | 관리자 현황·분석·시드 결과 |
| `postcard.ts` | 공개 엽서·댓글·반응 응답 타입 |

## 방 ID

현재 공개 방 상수는 `packages/shared/src/index.ts`에서 관리함.

```ts
LOBBY_ROOMS = {
  BOX_OFFICE: "box-office",
  GACHA: "gacha",
}
```

## 빌드

```bash
pnpm --filter @cinemo/shared build
```

공유 타입 변경 후 API와 Web의 타입 오류를 함께 확인함.
