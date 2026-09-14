# Neon PostgreSQL

## Docker와 Neon 구분

Docker PostgreSQL은 로컬 개발용 DB. Neon PostgreSQL은 Railway API가 연결하는 운영용 DB.
같은 PostgreSQL 계열이지만 서로 다른 DB 인스턴스와 데이터 저장소.

| 구분 | Docker PostgreSQL | Neon PostgreSQL |
|---|---|---|
| 사용 환경 | 로컬 개발 | Railway 운영 |
| 주소 | `localhost:5445` | Neon host |
| SSL | `sslmode=disable` | `sslmode=verify-full` |
| migration | `prisma migrate dev` | `prisma migrate deploy` |
| 데이터 | 개발용 데이터 | 운영 데이터 |

Docker가 Neon을 실행하거나 대체하는 구조가 아님.
Docker 구성과 로컬 실행은 [docker.md](../docker.md), 운영 배포 흐름은 [deploy README](./README.md) 참고.

## 환경변수

Railway API 서비스 Variables에 Neon 연결 문자열 등록.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=verify-full
```

Railway API HTTP 포트:

```env
PORT=3050
```

NestJS는 `PORT`를 읽고 값이 없을 때만 `3050`을 기본값으로 사용.

```ts
const port = configService.get<number>(EnvKeys.PORT) ?? 3050;
```

로컬과 배포 DB 연결 문자열 분리:

```txt
로컬   localhost:5445
배포   Neon host + sslmode=verify-full
```

## 연결 오류 점검

확인 항목:

- Railway Variables의 `DATABASE_URL`이 Neon 주소인지 확인
- 비밀번호에 특수문자가 있으면 URL 인코딩
- 배포 DB에 `sslmode=verify-full` 사용
- 로컬 Docker DB 주소(`localhost:5445`)를 Railway에 입력하지 않음
- migration이 적용된 Neon DB인지 확인

## Prisma migration

Migration 실행 위치는 API workspace 기준.

```bash
pnpm --filter api exec prisma migrate deploy
```

개발 환경에서 새 migration 생성:

```bash
pnpm --filter api exec prisma migrate dev --name 변경내용
```

배포 환경에서는 이미 만들어진 migration을 `migrate deploy`로 적용.

```txt
1. Railway에 DATABASE_URL 등록
2. Prisma Client generate
3. Neon에 prisma migrate deploy 실행
4. NestJS API 시작
```

Railway Build Command의 `prisma generate`는 Prisma Client만 생성하고 Neon 테이블은 변경하지 않음. 새 migration이 포함된 배포에서는 같은 Neon `DATABASE_URL`을 대상으로 `migrate deploy` 별도 실행.

## MoviePool seed DB 오류

증상:

```txt
500 {"statusCode":500,"message":"데이터베이스 오류가 발생했습니다."}
```

원인:

- cron endpoint가 `movie_pool_seed_runs`에 실행 시작 기록을 먼저 저장
- Neon에 `MoviePoolSeedRun` migration이 적용되지 않으면 첫 DB write에서 실패
- Prisma 오류가 API 공통 예외 필터에서 일반 DB 오류 메시지로 변환

해결:

```bash
pnpm --filter api exec prisma migrate deploy
```

적용 후 GitHub Actions를 다시 실행하고 `/admin`의 최근 시드 결과 모달에서 성공·저장·건너뜀·실패 수 확인.
