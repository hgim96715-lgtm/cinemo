# CINEMO

**CINEMO** = Cinema + Motion.  
Cinema in Motion — 영화가 움직이고, 사람들이 움직이고, 이야기가 움직이는 영화관 로비.

Cinema는 그리스어 *kínēma*(κίνημα, 움직임)에서 온 말.  
Movie가 “한 편의 영상”에 가깝다면, Cinema는 영화라는 매체·공간·문화 쪽 뉘앙스.  
로비 → 뽑기 → 후기 → 명대사처럼 **사람이 움직이며 이야기가 이어지는** 구조라서 이 이름을 씀.

NestJS + Next.js 모노레포. 현재는 웹 서비스에 집중하고 있다.

## 배포

- [CINEMO 포트폴리오](https://cinemo-six.vercel.app)
- Web: Vercel · API: Railway · DB: Neon
- MoviePool 시드·하루 Excel: GitHub Actions

## 핵심 흐름

로비 → 박스오피스·관심 순위·MOVIE CHART 확인 → 하루 티켓 → 영화 뽑기 → MY CINEMA 관람 기록 → 명대사·엽서

관리자는 `/admin`에서 통계·시드·로비 가이드를 관리한다.

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

Swagger UI: http://localhost:3050/api

공유 패키지:

- `@cinemo/shared`: API와 Web이 함께 사용하는 순수 도메인 타입·상수·유틸
- `@cinemo/api-contract`: OpenAPI에서 생성한 HTTP 요청·응답 계약 타입

`MOVIE CHART`는 KOBIS 현재 박스오피스와 TMDB 영화 정보를 조합한다.
과거 월별·주별 흐름은 `MovieChartSnapshot`을 매일 저장한 뒤 확장할 예정.


| | 포트 |
|--|--|
| API | 3050 |
| Web | 3051 |
| Postgres | 5445 |

```bash
docker compose up -d   # Postgres
```

문서: [docs/README.md](docs/README.md)에서 전체 구조와 기능별 문서를 확인할 수 있다.
Redis · FCM은 이후 확장 대상.

## 기술 구성

- Web: Next.js · React · TypeScript
- API: NestJS · Prisma · PostgreSQL
- 실시간: 고객센터 도입 시 WebSocket 확장 예정
- 외부 데이터·서비스:
  - TMDB: 영화 메타데이터·포스터·감독·줄거리·개봉 예정작·시청 정보
  - KOBIS: 국내 일일 박스오피스·누적 관객 수·순위 변동
  - Kakao Local: 관람 장소 검색 추천
  - Claude/OpenAI: 영화 정보 보완·명대사 후보 추천 Provider
- 운영 자동화: Railway · Neon · Vercel · GitHub Actions

모바일 클라이언트와 Redis·FCM은 이후 확장 대상.

### 개봉일 이메일 알림에 사용한 패키지

- `resend` — 이메일 발송
- `@react-email/components` — React Email 템플릿 작성
- `@react-email/render` — 이메일 컴포넌트를 HTML로 렌더링
- `react` · `react-dom` — React Email 렌더링 런타임
- `@nestjs/schedule` — 개봉일 알림 Cron 실행

자세한 구조와 구현 기준: [docs/README.md](docs/README.md)
