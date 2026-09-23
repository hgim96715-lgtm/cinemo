# CINEMO

**CINEMO** = Cinema + Motion.  
Cinema in Motion — 영화가 움직이고, 사람들이 움직이고, 이야기가 움직이는 영화관 로비.

Cinema는 그리스어 *kínēma*(κίνημα, 움직임)에서 온 말.  
Movie가 “한 편의 영상”에 가깝다면, Cinema는 영화라는 매체·공간·문화 쪽 뉘앙스.  
로비에서 영화를 발견하고, 보고 싶은 영화와 관람 기록을 쌓고, 포스트카드로 이야기를 남기는 흐름이라서 이 이름을 채택했습니다.

NestJS + Next.js 모노레포.

## 배포

- [CINEMO 포트폴리오](https://cinemo-six.vercel.app)
- Web: Vercel · API: Railway · DB: Neon
- MoviePool demo seed·MOVIE CHART 수집·개봉일 알림: GitHub Actions

## 핵심 흐름

로그인 → CINEMO LOBBY
  → 박스오피스·관심 순위·MOVIE CHART 확인
  → 개봉 예정작 확인 → 보고 싶어요(WISH) 저장 → 개봉일 이메일 알림
  → MY CINEMA에서 관람 기록 관리
  → MY POSTCARD에서 영화 문장 기록·공개·댓글

영화관 탐색은 `CINEMA MAP`에서 별도 제공하며, 영화 달력·영화 통계는 MY CINEMA의 확장 영역으로 준비 중입니다.

관리자는 `/admin`에서 대시보드·시간대 분석·사용자 관리를 수행함. Demo seed는 관리자 화면이 아니라 보호된 API를 GitHub Actions에서 호출해 실행합니다.

## 구조

```
cinemo/
  apps/api             # NestJS + Prisma API
  apps/web             # Next.js Web
  packages/shared     # API/Web 순수 공통 타입·상수·유틸
  packages/api-contract # OpenAPI 생성 API 계약 타입
  docs/               # 현재 구조와 구현 기준 문서
```

```bash
pnpm install
pnpm build:shared   # 공유 패키지 빌드 (install 시 prepare로도 실행)
pnpm dev:api   # http://localhost:3050
pnpm dev:web   # http://localhost:3051
```

Swagger UI: [http://localhost:3050/api](http://localhost:3050/api)

공유 패키지:

- `@cinemo/shared`: API와 Web이 함께 사용하는 순수 도메인 타입·상수·유틸
- `@cinemo/api-contract`: OpenAPI에서 생성한 HTTP 요청·응답 계약 타입

`MOVIE CHART`는 KOBIS 국내 박스오피스 데이터와 TMDB 영화 메타데이터를 조합 했습니다.

일별 차트와 순위 변화를 `MovieChartSnapshot`으로 저장하며, 월별·주별 분석은 저장된 스냅샷을 확장해 제공할 예정입니다.


|          | 포트   |
| -------- | ---- |
| API      | 3050 |
| Web      | 3051 |
| Postgres | 5445 |


```bash
docker compose up -d   # Postgres
```

문서: [docs/README.md](docs/README.md)에서 전체 구조와 기능별 문서를 확인할 수 있습니다.

 Redis · FCM은 이후 확장 대상.

## 기술 구성

- Web: Next.js · React · TypeScript
- API: NestJS · Prisma · PostgreSQL
- 모노레포: pnpm workspace
- API 계약: OpenAPI 문서에서 `@cinemo/api-contract` 타입 생성
- 상태 관리: Zustand
- 폼·검증: React Hook Form · Zod
- UI 기반: Radix Dialog · Radix Tabs · Lucide React
- 인증: JWT 세션 · Google/Naver OAuth · Resend 기반 비밀번호 재설정
- DB 접근: Prisma Client · PostgreSQL migration
- 외부 데이터·서비스:
  - TMDB: 영화 메타데이터·포스터·감독·출연진·줄거리·개봉일
  - KOBIS: 국내 일일 박스오피스·누적 관객 수·순위 변동
  - Kakao Local: 관람 장소 검색 추천
  - Claude/OpenAI: 영화 정보 보완·명대사 후보 추천 Provider
- 운영 자동화: GitHub Actions → 보호된 Railway API endpoint → Neon DB
- 배포: Web은 Vercel, API는 Railway, DB는 Neon

모바일 클라이언트와 Redis·FCM은 이후 확장 대상.

### 개봉일 이메일 알림에 사용한 패키지

- `resend` — 이메일 발송
- `@react-email/components` — React Email 템플릿 작성
- `@react-email/render` — 이메일 컴포넌트를 HTML로 렌더링
- `react` · `react-dom` — React Email 렌더링 런타임
- GitHub Actions — 개봉일 알림·MOVIE CHART 수집·demo seed를 정해진 시간에 실행

개봉일 알림은 API 내부 Cron이 아니라 GitHub Actions가 `x-cron-secret`으로 보호된 API endpoint를 호출하는 방식

자세한 구조와 구현 기준: [docs/README.md](docs/README.md)