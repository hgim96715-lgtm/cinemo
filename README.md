# CINEMO

**CINEMO** = Cinema + Motion.  
Cinema in Motion — 영화가 움직이고, 사람들이 움직이고, 이야기가 움직이는 영화관 로비.

Cinema는 그리스어 *kínēma*(κίνημα, 움직임)에서 온 말.  
Movie가 “한 편의 영상”에 가깝다면, Cinema는 영화라는 매체·공간·문화 쪽 뉘앙스.  
로비 → 뽑기 → 후기 → 카페테리아처럼 **사람이 움직이며 이야기가 이어지는** 구조라서 이 이름을 씀.

NestJS + Next.js 모노레포. 현재는 웹 서비스에 집중하고 있음.

## 배포

- [CINEMO 포트폴리오](https://cinemo-six.vercel.app)
- Web: Vercel · API: Railway · DB: Neon
- MoviePool 시드·하루 Excel: GitHub Actions

## 핵심 흐름

로비 → 하루 티켓 → 영화 뽑기 → 후기방 → 카페

관리자는 `/admin`에서 통계·시드·로비 가이드·카페 공지를 관리함.

## 구조

```
cinemo/
  apps/api        # NestJS + Prisma
  apps/web        # Next.js
  packages/shared # api/web 공유 (`@cinemo/shared`)
```

```bash
pnpm install
pnpm build:shared   # 공유 패키지 빌드 (install 시 prepare로도 실행)
pnpm dev:api   # http://localhost:3050
pnpm dev:web   # http://localhost:3051
```

Swagger UI: http://localhost:3050/api

공유 코드: `@cinemo/shared` (`workspace:*`)  
- API와 Web이 함께 사용하는 도메인 타입·상수
- 티켓 상태·가챠 머신·프로필·카페·관리자 응답 타입 포함


| | 포트 |
|--|--|
| API | 3050 |
| Web | 3051 |
| Postgres | 5445 |

```bash
docker compose up -d   # Postgres
```

로컬 메모: `docs/state.md` · `docs/docker.md` · `docs/prisma/` (gitignore)  
Redis · FCM은 나중.

## 현재 기능

- 로비: 전광판·KST 날짜·직원 안내·하루 티켓
- 뽑기방: 장르·국적·추천 머신으로 TMDB 영화를 뽑고 찜·봤어요 저장
- 후기방: REVIEW BALL에서 영화별 후기·별점·좋아요 작성
- 카페: 테이블별 실시간 대화와 공지 모달
- 로비 가이드: 회원가입 직후 온보딩 안내를 단계별로 표시하고 관리자가 편집
- 관리자 화면: 통계·MoviePool 시드·하루 Excel·카페 공지·로비 가이드 관리

## 기술 구성

- Web: Next.js · React · TypeScript
- API: NestJS · Prisma · PostgreSQL
- 실시간: WebSocket 기반 카페 테이블
- 외부 데이터: TMDB 영화·포스터·시청 정보
- 운영 자동화: Railway · Neon · Vercel · GitHub Actions

모바일 클라이언트와 Redis·FCM은 이후 확장 대상.

자세한 로컬 메모: [docs/README.md](docs/README.md) (로컬 전용·gitignore)
