# CINEMO 문서 지도

이 문서는 CINEMO를 다시 이해할 때 가장 먼저 여는 입구임.

문서의 기준은 다음 세 가지로 나눔.

- 현재 구현: 실제 코드·DB·배포 환경과 일치해야 하는 내용
- 동작 원리: 기능이 왜 이렇게 연결되는지 설명하는 내용
- 미래 설계: 아직 구현하지 않은 모델·기능을 아이디어로 보관하는 내용

> [!note] 빠른 원칙
> 코드가 바뀌면 관련 기능 문서와 `docs/prisma/README.md`의 데이터 모델을 함께 확인함. 미래 설계 문서는 현재 구조로 오해하지 않도록 별도 표시함.

## 0. 최근 작업 기준 (2026-09-01)

현재 코드와 함께 기억할 운영 규칙:

```txt
관리자 진입
  · admin 로그인 → /admin
  · 관리자 로비 체류 → /?lobby=1
  · 로비의 MY ROOM 대신 CINEMO OFFICE → /admin
  · /admin 사이드바에 로비로 + 로그아웃 추가

공간 이동
  · admin의 뽑기방·후기방·카페: 관리자 화면(/admin) + 로비로(/?lobby=1)
  · user의 로비 링크: /

관리자 로비
  · ADMIN_AVATAR 전용 캐릭터
  · TICKET API 조회·발급 UI 없음
  · 데스크 상태: 운영 모드
  · 직원 대사: 관리자님, 오늘도 운영 확인하러 오셨네요~

로컬 demo seed
  · 신규 계정: 현재 DEMO_SEED_PASSWORD로 register
  · 재방 계정: AuthService.login()을 호출하지 않고
    AdminService.recordGuestLogin(user.id) + 도메인 활동 실행
  · 이전 실행과 비밀번호가 달라도 재방 seed가 실패하지 않음

Daily Excel
  · AdminDailyReport migration은 운영 Neon에 migrate deploy 필요
  · Railway prisma generate는 Client 생성만 수행
  · 403 cron은 controller 클래스의 @Roles와 @Public 충돌 여부 확인

데모·QA 계정
  · `TEST_USER_EMAIL` + `TEST_USER_PASSWORD`로 `cinemo-test` 계정 생성
  · `isTestAccount=true` 계정은 운영 통계·Daily Excel 집계에서 제외
  · demo seed는 후기와 `review_post_likes`도 함께 생성

MoviePool 캐시
  · 오류 문구가 제목으로 저장된 오래된 row는 `getMovieCached()`가 TMDB 재조회
  · 잘못된 제목은 가챠 후보에서도 제외

모바일 대응
  · 로비 전광판은 2열, 주간 TOP 3는 전체 폭
  · 로비는 모바일에서 세로 스크롤 허용
  · 관리자 사이드바는 모바일에서 상단 2열 메뉴로 전환
  · 후기·전광판은 로딩 상태와 빈 결과 상태를 분리
  · 상세 기록은 [web/mobile.md](./web/mobile.md)

MY ROOM 포스터 전시
  · `UserMovie`에 `isDisplayed`, `displayOrder`, `wallSlot(1~3)` 저장
  · 포스터 슬롯 클릭 → `PosterPickerModal`에서 영화 제목 검색
  · `/v1/user-movies/display`가 watched upsert와 전시 저장을 트랜잭션으로 처리
  · 같은 슬롯·같은 영화의 기존 전시는 자동 해제
  · 새로고침 시 `/v1/user-movies/displayed`의 `{ items }`로 전시 상태 복원
  · 포스터 이미지는 저장하지 않고 `tmdbId`로 `getMovieCached()` 조합

MY ROOM 화면 개편
  · 책장·서랍·문짝 형태의 장식 CSS 제거
  · 관람 기록·보고 싶은 영화·스타일룸은 아이콘형 공간 링크로 통일
  · 고객센터는 전화기 아이콘 공간으로 유지하고 기능은 준비 중 상태
  · 내 태그는 아바타 아래에 표시하며 `profilePublic` 여부와 무관하게 본인 방에서 노출
  · 방 내부는 `.room-scene-layout` 단일 CSS Grid 기준으로 배치
  · 데스크톱은 포스터 3칸과 오른쪽 상단 관람일·명대사 화이트보드 카드로 구성
  · 데스크톱 캐릭터 영역은 오른쪽 열의 중간~하단을 세로로 사용해 말풍선·태그 확장 공간을 확보
  · 아이패드·모바일은 기능 카드를 2열로 확장하고 메뉴를 별도 Grid 행으로 분리
  · 방 메뉴의 `position: absolute` 좌표 의존을 제거해 요소 간 겹침을 방지
  · 모바일 캐릭터 행은 `max-content`로 계산하고 작은 화면에서는 방 세로 비율을 늘려 태그와 하단 메뉴 충돌을 방지
  · 창문을 사용자 지정 그림 액자로 바꾸는 기능은 보류

관람일·영화 달력·관람 통계 (2026-09-02)
  · `UserMovie.watchedAt`을 추가해 영화별 관람일 1개 저장
  · `POST/PATCH/DELETE /user-movies/watched-at`으로 추가·수정·삭제
  · `/room`의 관람일 카드 → `MovieCalendarModal` 연결
  · 달력에서 2000년부터 현재 연도까지 연도 선택 가능
  · 월 선택·이전·오늘·다음 이동, 오늘 이전 날짜에 영화 추가 가능
  · 날짜 클릭 → 해당 날짜 관람 영화·수정·삭제 표시
  · 영화 포스터 선택은 `PosterPickerModal`이 달력보다 앞에 표시
  · `/room/watched`에 영화 제목·감독·개봉연도 검색 추가
  · 관람 연도만·월만·연도+월 조합 필터 지원
  · 관람 기록 카드에 KST 기준 `관람 YYYY.MM.DD` 표시
  · `/user-movies/stats?year=`와 `MovieStatsPanel`로 연간·월간 통계 표시
  · 월 범위는 KST 기준 `[start, end)`로 계산해 다른 달 기록이 섞이지 않도록 처리
  · 영화 1편당 관람일 1개만 유지하며 반복 관람 이력은 미래 범위

최근 내 방 UI 커밋
  · `df201cf` 방 기능 영역 UI 구성
  · `fd14147` 태블릿·모바일 방 비율 조정
  · `0d095b3` 아이패드·아이폰 메뉴 겹침 조정
  · `dc375b4` 방 레이아웃과 기능 카드 정리
  · `8061a91` 모바일 방 레이아웃 겹침 수정

명대사방 (QUOTE FILM)
  · 로비 `LOBBY_ROOMS.QUOTE_FILM = "quote-film"` → `/quote` 연결
  · 공개 명대사 카드 그리드와 `/room/quotes` 저장 모음집 추가
  · 명대사·영화 제목·닉네임 서버 검색, cursor 페이지네이션, `loading="lazy"`
  · `QuotePost` · `QuotePostBookmark` 모델과 생성·수정·삭제·저장 API 추가
  · 필름 레일·퍼포레이션·포스터 오버레이·하단 그라디언트로 그리드에서도 필름 UI 유지
  · 긴 명대사는 단계별 폰트 축소·줄 제한·title 전체 문구로 카드 높이 고정
  · 데모 후기 활동마다 명대사와 작성자 저장 기록을 함께 생성
  · 상세 화면·API·DB·마이그레이션은 [web/quote.md](./web/quote.md)
```

## 1. 무엇부터 읽을지

### 프로젝트 전체를 처음 설명할 때

1. [architecture.md](./architecture.md) — 서비스 전체 구조와 핵심 사용자 여정
2. [prisma/README.md](./prisma/README.md) — 현재 DB와 ER 다이어그램
3. [web/lobby.md](./web/lobby.md) — 로그인 후 로비 진입
4. [web/ticket.md](./web/ticket.md) — 하루 티켓과 뽑기 진입 조건
5. [web/gacha.md](./web/gacha.md) — MoviePool에서 영화 선택
6. [web/review.md](./web/review.md) — 영화 감상 후기
7. [web/cafe.md](./web/cafe.md) — 카페 테이블과 실시간 대화
8. [web/quote.md](./web/quote.md) — 명대사 공개 아카이브·저장 모음집·필름 카드

### 기능을 수정할 때

1. [web/auth.md](./web/auth.md) — 인증, 세션, `apiFetch`, 초기 사용자 복원
2. [state.md](./state.md) — 서버 상태·클라이언트 상태·실시간 상태의 구분
3. [shared.md](./shared.md) — API와 Web이 공유하는 타입·상수
4. 수정할 기능 문서 — 화면, API, DB 연결 확인
5. [deploy.md](./deploy.md) — Railway·Neon·Vercel·GitHub Actions 반영 순서

### 운영·배포를 설명할 때

1. [web/admin.md](./web/admin.md) — 관리자 화면과 MoviePool 시드 확인
2. [web/tmdb.md](./web/tmdb.md) — TMDB 수집·MoviePool·시드 처리
3. [deploy.md](./deploy.md) — Railway API, Neon DB, Vercel Web, GitHub Actions
4. [seed.md](./seed.md) — 시드 데이터와 초기 데이터 흐름

## 2. 한눈에 보는 제품 흐름

```mermaid
flowchart LR
  Register[회원가입] --> Guide[로비 가이드]
  Guide --> Lobby[로비]
  Lobby --> Ticket[매표소 · 하루 티켓]
  Ticket --> Gacha[뽑기방]
  Gacha --> Movie[MoviePool 영화]
  Movie --> Review[후기방]
  Lobby --> Quote[QUOTE FILM · 명대사방]
  Quote --> QuoteArchive[/quote 공개 아카이브]
  QuoteArchive --> QuoteCollection[/room/quotes 저장 모음집]
  Lobby --> Cafe[카페]
  Review --> Cafe

  Cron[GitHub Actions · KST 02:00 전후] --> Seed[MoviePool 시드]
  Seed --> Movie
  Admin[관리자] --> Ops[시드 운영 화면]
  Ops --> Seed
```

## 3. 질문별 바로가기

| 알고 싶은 것 | 먼저 볼 문서 | 핵심 코드 위치 |
|---|---|---|
| 로그인·세션·`apiFetch` | [web/auth.md](./web/auth.md) | `apps/api/src/auth/`, `apps/web/lib/api.ts` |
| 현재 DB·ER·FK | [prisma/README.md](./prisma/README.md) | `apps/api/prisma/schema.prisma` |
| 회원가입 직후 가이드 | [web/guide.md](./web/guide.md) | `apps/api/src/guide/`, `apps/web/components/lobby/` |
| 관리자 운영 | [web/admin.md](./web/admin.md) | `apps/web/app/admin/`, `apps/api/src/admin/` |
| 하루 Excel 리포트 | [web/admin.md](./web/admin.md) · [web/auth.md](./web/auth.md) | `AdminDailyReport`, GitHub Actions, binary download |
| API 오류 해석 | [web/auth.md](./web/auth.md) · [deploy.md](./deploy.md) | 200 빈 응답, 401, 500, Railway 502, JSON·binary 구분 |
| MoviePool 시드 | [web/tmdb.md](./web/tmdb.md) | `apps/api/src/tmdb/`, `.github/workflows/` |
| 포트폴리오 demo 활동 | [seed.md](./seed.md) · [web/disposable-demo.md](./web/disposable-demo.md) | 최근 7일·카페 대화·purge |
| MY ROOM 포스터 전시 | [web/user-movie.md](./web/user-movie.md) · [prisma/current-model.md](./prisma/current-model.md) | `UserMovie` 전시 필드·포스터 검색 |
| 시드 배포·cron 인증 | [deploy.md](./deploy.md) | Railway·GitHub Actions 환경 변수 |
| 로비·티켓·뽑기 | [web/lobby.md](./web/lobby.md) · [web/ticket.md](./web/ticket.md) · [web/gacha.md](./web/gacha.md) | `apps/web/app/`, `apps/api/src/` |
| 후기·좋아요 | [web/review.md](./web/review.md) | `apps/api/src/review-post/`, `ReviewPostLike` |
| 명대사·QUOTE FILM | [web/quote.md](./web/quote.md) | `apps/api/src/quote-post/`, `apps/web/app/quote/`, `QuotePost` |
| QA 테스트 계정 | [web/admin.md](./web/admin.md) · [deploy.md](./deploy.md) | `apps/api/src/cli/test-user.ts`, `is_test_account` |
| 카페·공지·WebSocket | [web/cafe.md](./web/cafe.md) | `apps/api/src/cafe/`, `apps/web/app/cafe/` |
| 모바일 반응형·최근 오류 | [web/mobile.md](./web/mobile.md) | `lobby.css`, `admin.css`, Seed 오류 대응 |

## 4. 현재 구조의 기준점

| 영역 | 기준 파일·폴더 | 문서에서 확인할 것 |
|---|---|---|
| DB 모델 | `apps/api/prisma/schema.prisma` | 모델, enum, FK, unique, index |
| DB 변경 이력 | `apps/api/prisma/migrations/` | 실제 배포된 스키마 변화 |
| API 계약 | `packages/shared/src/` · 각 NestJS controller | 요청·응답 타입과 권한 |
| API 구현 | `apps/api/src/` | service의 규칙과 DB 접근 |
| Web 구현 | `apps/web/app/` · `apps/web/components/` | 화면 상태와 사용자 흐름 |
| Web 공통 통신 | `apps/web/lib/api.ts` | 토큰, 빈 응답, JSON, 오류 처리 |
| 배포 | `railway.toml` · `vercel.json` · `.github/workflows/` | 실행 환경과 자동화 |

## 5. 기능 문서 목록

### 기반·상태·배포

- [architecture.md](./architecture.md) — 모노레포, 서비스 경계, 핵심 루프
- [state.md](./state.md) — Query·Zustand·WebSocket·FCM 상태 구분
- [shared.md](./shared.md) — `@cinemo/shared`, 가챠·카페·프로필 타입
- [docker.md](./docker.md) — 로컬 Postgres와 Compose
- [deploy.md](./deploy.md) — Railway·Neon·Vercel·GitHub Actions
- [seed.md](./seed.md) — 초기 시드와 데이터 준비

### Web 기능

- [web/auth.md](./web/auth.md) — 세션·`apiFetch`·Bootstrap·avatar
- [web/admin.md](./web/admin.md) — 관리자 현황·운영·콘텐츠 관리
- [web/lobby.md](./web/lobby.md) — 로비 공간·조명·말풍선·스태프
- [web/guide.md](./web/guide.md) — 로비 가이드와 `/admin/guide` 편집
- [web/ticket.md](./web/ticket.md) — Ticket API·KST 하루 티켓
- [web/gacha.md](./web/gacha.md) — 장르·국적·추천방·캡슐·Claude enrich
- [web/review.md](./web/review.md) — 후기방·좋아요·주간 공개
- [web/quote.md](./web/quote.md) — QUOTE FILM·명대사 카드·검색·저장 모음집
- [web/board.md](./web/board.md) — 전광판·오늘의 후기·주간 하이라이트
- [web/cafe.md](./web/cafe.md) — 카페·공지·WebSocket
- [web/tmdb.md](./web/tmdb.md) — Discover·MoviePool·시드
- [web/user-movie.md](./web/user-movie.md) — 찜·봤어요·내 방·선반
- [web/avatar.md](./web/avatar.md) — `AvatarConfig`·옷방·`AvatarFigure`
- [web/profile.md](./web/profile.md) — bio·tags·공개 프로필·말풍선
- [web/sound.md](./web/sound.md) — 효과음·배경음·사용자 설정
- [web/disposable-demo.md](./web/disposable-demo.md) — 임시 데모·실험 메모
- [web/mobile.md](./web/mobile.md) — 모바일 반응형·로딩·배포 오류 대응
- [web-auth-store.md](./web-auth-store.md) — 인증 저장소 보충 메모

### DB

- [prisma/README.md](./prisma/README.md) — 현재 스키마·ER·관계·마이그레이션 기준
- [prisma/current-model.md](./prisma/current-model.md) — 도메인별 데이터 흐름과 현재 모델 설명
- [prisma/future-model.md](./prisma/future-model.md) — 아직 구현하지 않은 확장 설계

## 6. 프로젝트 구조와 실행 포트

```txt
apps/api/       NestJS API · Prisma · TMDB · 인증 · 관리자 운영
apps/web/       Next.js Web · 로비 · 뽑기 · 후기 · 카페 · 관리자 화면
packages/shared API/Web 공유 타입·상수·가챠 규칙
apps/api/prisma/schema.prisma
                현재 DB의 단일 기준
apps/api/prisma/migrations/
                DB 변경 이력
.github/workflows/
                MoviePool 시드 자동 실행
docs/           기능·구조·운영 설명
```

| 서비스 | 로컬 포트 |
|---|---:|
| API | `3050` |
| Web | `3051` |
| Postgres | `5445` |

## 7. 문서 업데이트 규칙

- DB 모델 추가·삭제·필드 변경 → `schema.prisma`, migration, [prisma/README.md](./prisma/README.md) 동시 확인
- API 응답 형태 변경 → 기능 문서와 [shared.md](./shared.md) 확인
- 인증·빈 응답·배포 오류 수정 → [web/auth.md](./web/auth.md), [deploy.md](./deploy.md) 갱신
- cron·시드 동작 변경 → [web/tmdb.md](./web/tmdb.md), [web/admin.md](./web/admin.md), [deploy.md](./deploy.md) 갱신
- 아직 구현하지 않은 기능 → [prisma/future-model.md](./prisma/future-model.md) 또는 해당 문서의 `미래 설계` 영역에만 기록
