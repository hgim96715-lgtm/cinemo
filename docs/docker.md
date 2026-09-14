# Docker · 로컬 인프라

현재 Docker Compose는 PostgreSQL 개발 DB만 실행.
NestJS API와 Next.js Web은 호스트에서 `pnpm` 명령으로 실행.

## 현재 구성

```mermaid
flowchart LR
  Dev[개발자 컴퓨터]
  API[호스트 NestJS API]
  Web[호스트 Next.js Web]
  DB[Docker PostgreSQL 17]

  Dev --> API
  Dev --> Web
  API --> DB
```

루트 `docker-compose.yml`의 현재 서비스:

| 서비스 | 이미지 | 호스트 포트 | 컨테이너 포트 |
|---|---|---:|---:|
| `db` | `postgres:17-alpine` | `5445` | `5432` |

## 현재 `docker-compose.yml`

현재 설정 원문:

```yaml
services:
  db:
    image: postgres:17-alpine
    container_name: cinemo-db
    env_file:
      - apps/api/.env
    ports:
      - '5445:5432'
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 40s
    networks:
      - cinemo-network

volumes:
  db_data:

networks:
  cinemo-network:
    driver: bridge
```

## 설정 항목 설명

| 항목 | 의미 |
|---|---|
| `services` | 실행할 컨테이너 서비스 목록 |
| `db` | 서비스 이름. Compose 명령과 내부 네트워크에서 사용 |
| `image` | 사용할 PostgreSQL 17 Alpine 이미지 |
| `container_name` | 실제 컨테이너 이름 `cinemo-db` |
| `env_file` | `apps/api/.env`의 PostgreSQL 환경변수 주입 |
| `ports` | 호스트 `5445`를 컨테이너 PostgreSQL 포트 `5432`에 연결 |
| `volumes` | 컨테이너를 내려도 DB 데이터를 유지하는 저장 공간 |
| `healthcheck` | PostgreSQL이 실제 연결 가능한 상태인지 확인 |
| `interval` | healthcheck 실행 간격 10초 |
| `timeout` | healthcheck 1회 최대 대기 시간 5초 |
| `retries` | 실패를 허용하는 연속 횟수 5회 |
| `start_period` | 컨테이너 시작 후 유예 시간 40초 |
| `networks` | 서비스가 연결되는 Docker 전용 네트워크 |
| `driver: bridge` | 같은 호스트 안에서 컨테이너 간 통신을 제공하는 기본 네트워크 방식 |

### 포트 `5445:5432`

```txt
호스트 컴퓨터:5445 → Docker 컨테이너:5432
```

PostgreSQL은 컨테이너 안에서 기본 포트 `5432`로 실행.
호스트의 다른 프로젝트와 포트 충돌을 피하기 위해 외부 포트만 `5445`로 변경.

따라서 호스트에서 실행하는 NestJS API의 `DATABASE_URL`은 `localhost:5445` 사용.
컨테이너 내부에서 API를 실행하는 구조라면 `db:5432` 사용.

### `env_file`

```yaml
env_file:
  - apps/api/.env
```

Compose가 `apps/api/.env`를 읽어 PostgreSQL 컨테이너의 초기 사용자·비밀번호·DB명을 설정.
API의 `DATABASE_URL`도 같은 계정·DB명을 사용해야 연결 가능.

### `db_data`

```yaml
volumes:
  db_data:
```

`db_data`는 Docker가 관리하는 named volume.
컨테이너 삭제와 DB 데이터 삭제를 분리하는 역할.

```txt
docker compose down        → 컨테이너·네트워크 제거, volume 유지
docker compose down -v     → 컨테이너·네트워크·volume까지 제거
```

`down -v`는 로컬 DB 데이터가 삭제되므로 초기화가 필요한 경우에만 사용.

### `healthcheck`

```yaml
test: ['CMD-SHELL', 'pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"']
```

`pg_isready`가 PostgreSQL의 연결 준비 상태를 확인.
`$$`는 Compose 변수 치환을 피하고 컨테이너 내부에서 `$POSTGRES_USER`, `$POSTGRES_DB`로 해석하기 위한 표기.

현재 Compose에는 API·Web 서비스가 없으므로 healthcheck 결과를 기준으로 다른 컨테이너를 자동 시작하는 `depends_on` 설정은 없음.

### `cinemo-network`

현재는 DB 서비스 하나만 연결된 전용 네트워크.
향후 API·Redis를 Compose에 추가하면 같은 네트워크에서 서비스 이름으로 통신 가능.

```txt
API 컨테이너 → db:5432
Redis 컨테이너 → redis:6379
```

현재 미사용 서비스:

- Redis: 향후 큐·Socket.IO adapter·레이트리밋 도입 시 검토
- API/Web Docker image: 별도 Dockerfile 구성 시 도입
- FCM: 모바일·웹 푸시 알림 도입 시 연동

## 로컬 실행

```bash
docker compose up -d
docker compose ps
docker compose down
```

DB 데이터는 `db_data` Docker volume에 보관.
`docker compose down`은 컨테이너와 네트워크를 내리지만 volume은 유지.

## 포트 기준

| 영역 | 주소 또는 포트 | 용도 |
|---|---|---|
| API | `localhost:3050` | 호스트에서 실행하는 NestJS |
| Web | `localhost:3051` | 호스트에서 실행하는 Next.js |
| PostgreSQL | `localhost:5445` | Docker 컨테이너의 `5432` 매핑 |
| Redis | `localhost:6380` | 현재 미사용, 향후 예정 |

다른 로컬 프로젝트와의 충돌 방지를 위해 PostgreSQL 호스트 포트는 `5445` 사용.

```txt
music PostgreSQL 5433
flow   PostgreSQL 5444
cinemo PostgreSQL 5445
```

## 로컬 환경변수

`apps/api/.env`의 PostgreSQL 계정·DB명과 `DATABASE_URL`의 계정·DB명이 일치해야 함.
`DATABASE_URL`의 포트는 Compose `ports` 왼쪽 값인 `5445`.

```env
PORT=3050
FRONTEND_URL=http://localhost:3051
POSTGRES_USER=cinemo
POSTGRES_PASSWORD=cinemo
POSTGRES_DB=cinemo
POSTGRES_PORT=5445
DATABASE_URL=postgresql://cinemo:cinemo@localhost:5445/cinemo?schema=public&sslmode=disable

# 현재 미사용
# REDIS_URL=redis://localhost:6380
```

## Docker와 Neon의 관계

Docker PostgreSQL과 Neon PostgreSQL은 같은 PostgreSQL 계열이지만 서로 다른 DB 인스턴스.

```mermaid
flowchart LR
  Local[로컬 개발]
  DockerDB[Docker PostgreSQL<br/>localhost:5445]
  Railway[Railway API]
  Neon[Neon PostgreSQL<br/>운영 DB]

  Local --> DockerDB
  Local -->|DATABASE_URL| DockerDB
  Railway -->|DATABASE_URL| Neon
```

| 구분 | 로컬 | 배포 |
|---|---|---|
| DB 위치 | Docker 컨테이너 | Neon 관리형 PostgreSQL |
| API 연결 | `localhost:5445` | Neon host |
| SSL | `sslmode=disable` | `sslmode=verify-full` |
| migration | `prisma migrate dev` | `prisma migrate deploy` |
| 데이터 | 개발용 데이터 | 운영 데이터 |

로컬 Docker DB에서 실행한 migration과 운영 Neon DB의 migration은 별도 적용 대상.
Docker가 Neon을 실행하거나 대체하는 구조가 아님.

자세한 운영 DB 연결은 [deploy/neon.md](./deploy/neon.md) 참고.

## FCM 개념

FCM은 `Firebase Cloud Messaging`의 약자.
Firebase가 제공하는 모바일·웹 푸시 메시지 전송 서비스.

```mermaid
flowchart LR
  App[앱·브라우저]
  Token[디바이스 토큰]
  Server[NestJS API 또는 알림 워커]
  FCM[Firebase Cloud Messaging]
  Device[사용자 디바이스]

  App --> Token
  Token --> Server
  Server --> FCM
  FCM --> Device
```

구성 요소:

- 디바이스 토큰: 앱·브라우저를 식별하는 수신 주소
- Firebase 프로젝트: FCM 발송 권한과 설정 관리
- 서버 인증 정보: 서버에서 FCM을 호출하기 위한 비공개 자격 증명
- 발송 서버: 이벤트 발생 시 토큰과 메시지를 FCM에 전달

현재 CINEMO는 FCM을 사용하지 않음.

- Firebase·FCM 패키지 미설치
- 디바이스 토큰 저장 모델과 endpoint 없음
- 현재 개봉일 알림은 `MovieReleaseNotification`과 NestJS Cron을 통한 이메일 방식
- 이메일 발송은 React Email과 Resend 사용

FCM은 Docker 서비스가 아니며 Neon과 직접 연결되는 기능도 아님.
향후 도입 시 Firebase 설정·토큰 저장 DB·발송 worker 구성이 추가 대상.

## Redis와 향후 확장

MVP·단일 NestJS 프로세스에서는 Redis가 필수 아님.

도입 대상:

- BullMQ 기반 알림·잡 큐
- Socket.IO Redis adapter를 통한 다중 인스턴스 통신
- 분산 레이트리밋
- 짧은 수명의 집계 캐시

프론트 상태 관리(Zustand·Query)와 Redis는 별도 계층.
