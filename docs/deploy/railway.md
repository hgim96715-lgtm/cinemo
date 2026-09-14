# Railway

환경변수 이름과 NestJS 내부 설정 접근 방식은 별개임. Railway Variables에는 기존 환경변수 이름을 그대로 등록하고, API 내부에서는 `registerAs` namespace를 통해 읽음.

설정 구조와 `Joi` 검증의 역할은 [NestJS 환경 설정 문서](../concepts/nest-config.md) 참고.

## graceful shutdown

`apps/api/src/main.ts`에서 `app.enableShutdownHooks()`를 활성화함.

Railway가 배포·재시작 과정에서 API에 `SIGTERM`을 전달하면 NestJS 종료 훅이 실행되고, 현재 `PrismaService`의 `onModuleDestroy()`가 Prisma DB 연결을 정리함.

```txt
Railway SIGTERM
  → NestJS shutdown hooks
  → PrismaService.$disconnect()
  → API 프로세스 종료
```

상세 개념과 적용 기준은 [NestJS graceful shutdown 문서](../concepts/graceful-shutdown.md) 참고.

## 빌드 오류

증상:

```txt
Property 'adminDailyStat' does not exist on type 'PrismaService'
Property 'adminHourlyStat' does not exist on type 'PrismaService'
Property 'user' does not exist on type 'PrismaService'
Cannot find module '../generated/prisma/client'
```

원인:

- Prisma Client 생성 결과가 `apps/api/src/generated/prisma`에 생성
- 해당 폴더가 `.gitignore` 대상
- 로컬에는 이전 생성 결과가 남아 있지만 Railway의 깨끗한 빌드 환경에는 없음
- `nest build` 전에 `prisma generate`가 실행되지 않음

해결:

`apps/api/package.json`의 API build script에서 Prisma Client를 먼저 생성.

```json
{
  "scripts": {
    "build": "prisma generate --schema prisma/schema.prisma && rm -f tsconfig.build.tsbuildinfo && nest build"
  }
}
```

Railway Build Command:

```bash
pnpm --filter api build
```

배포 로그의 확인 순서:

```txt
prisma generate --schema prisma/schema.prisma
rm -f tsconfig.build.tsbuildinfo
nest build
```

배포가 이전 커밋을 사용하면 수정 전 로그가 계속 표시. Railway Deployment의 commit과 GitHub 최신 커밋 비교.

## Prisma migration

Railway API 서비스의 **Settings → Deploy → Pre-deploy Command**에 migration 명령 등록.

저장소 루트가 서비스 Root Directory인 현재 구조:

```bash
pnpm --filter api exec prisma migrate deploy --schema prisma/schema.prisma
```

서비스 Root Directory를 `apps/api`로 설정한 경우:

```bash
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
```

필수 조건:

- Railway PostgreSQL의 `DATABASE_URL`이 API 서비스에 연결
- migration 파일이 Git에 커밋
- `migrate deploy`는 새 migration을 만들지 않고 이미 생성된 migration만 적용
- 실패 시 새 배포가 진행되지 않고 기존 배포 유지

## `railway.toml` 주의

현재 프로젝트 구조에서는 `railway.toml`을 사용하지 않음.

기존 설정의 문제:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/api/Dockerfile"

[deploy]
startCommand = "pnpm run start:deploy"
```

- `apps/api/Dockerfile` 없음
- `start:deploy` script 없음
- 현재 배포는 Railway Dashboard의 Build Command로 충분

Dockerfile과 production start script를 별도로 구성하는 시점에 `railway.toml` 재도입.

## Railway 502

NestJS 초기화 성공 로그가 있어도 외부 요청이 502일 수 있음.

```txt
502 Application failed to respond
```

확인 순서:

1. Railway Variables에 `PORT=3050` 등록
2. Service Domain의 Target Port를 `3050`으로 설정
3. Railway 재배포
4. API 도메인의 `/v1/health` 확인
5. 정상 응답 확인 후 GitHub Actions 수동 실행

```json
{"ok":true}
```

Railway Variables와 NestJS listen port의 일치 기준:

```txt
Railway Variables PORT       3050
Service Domain Target Port   3050
NestJS listen port            3050
```

`CINEMO_API_URL`은 Vercel Web 주소가 아닌 Railway API 주소.

```env
CINEMO_API_URL=https://실제-railway-api-domain.up.railway.app
```

## QA 테스트 계정

QA 계정을 Railway DB에서 사용할 때만 API 서비스 Secret 등록.

```env
TEST_USER_EMAIL=cinemo-test@cinemo.invalid
TEST_USER_PASSWORD=8자_이상_비밀번호
```

두 변수는 API 부팅 필수값이 아니며 테스트 계정 생성 CLI에서 사용.

```bash
pnpm --filter api test:user
```

비밀번호는 GitHub·문서·로그에 기록하지 않음.
