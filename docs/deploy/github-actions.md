# GitHub Actions

> [!note]
> 현재 예약 실행의 기본 위치는 GitHub Actions다. 장기적으로는 Cloud Scheduler가 Cloud Run Job을 호출하는 구조를 검토한다.

## 기본 사용법

GitHub Actions workflow는 저장소의 `.github/workflows/*.yml`에 작성한다.

```txt
workflow
  → trigger(on)
  → job(runs-on)
  → step(uses 또는 run)
  → 로그·성공/실패 결과
```

### 실행 방식

| 방식 | 용도 |
| --- | --- |
| `schedule` | 정해진 시간에 자동 실행 |
| `workflow_dispatch` | GitHub Actions 화면에서 수동 실행 |
| `push`, `pull_request` | 코드 변경 검증이나 배포 |

현재 CINEMO의 배치 workflow는 배포된 Railway API를 호출한다. KOBIS·TMDB·DB 처리 로직을 workflow 안에 직접 넣지 않고 API 서비스에 둔다.

### 수동 실행

1. GitHub 저장소의 `Actions` 메뉴로 이동
2. 왼쪽에서 실행할 workflow 선택
3. `Run workflow` 선택
4. 필요한 입력값을 넣고 실행
5. 실행 목록에서 job과 step별 로그 확인

`workflow_dispatch`가 workflow에 선언되어 있어야 수동 실행 메뉴가 나타난다. 예약 실행은 기본 브랜치의 최신 workflow를 기준으로 동작한다.

### Secrets 등록

GitHub 저장소의 `Settings → Secrets and variables → Actions → New repository secret`에서 등록한다.

현재 사용하는 값:

```txt
CINEMO_API_URL
CINEMO_CRON_SECRET
CINEMO_DEMO_SEED_SECRET
```

workflow에서는 `${{ secrets.SECRET_NAME }}`을 환경변수로 전달한다. 비밀값을 YAML·소스 코드·로그에 직접 작성하지 않는다.

### cron 시간

기본 cron 시간은 UTC 기준으로 해석한다. KST 실행 시 UTC에서 9시간을 뺀 값으로 작성한다.

```txt
KST 02:05 → UTC 17:05 → 5 17 * * *
KST 02:30 → UTC 17:30 → 30 17 * * *
```

예약 실행은 시스템 사정으로 지연될 수 있으므로, 실행 시각 자체보다 API가 처리한 기준일과 결과 로그를 확인한다.

## MovieChart 자동 수집

MovieChart는 용도에 따라 관리자 백필과 Actions 일일 수집을 나눈다.

```txt
관리자 백필
  Swagger
    → POST /v1/lobby/movie-chart/backfill
    → 지정 기간 수집
    → MovieChartSnapshot upsert

일일 자동 수집
  GitHub Actions
    → POST /v1/lobby/movie-chart/cron
    → x-cron-secret 검증
    → 하루 기준일 수집
    → MovieChartSnapshot upsert
```

workflow 파일은 `.github/workflows/movie-chart.yml`이다. 관리자 JWT를 Actions에 저장하지 않고, `CRON_SECRET`을 이용한 내부 호출로 일일 수집을 실행한다.

### MovieChart workflow

```txt
schedule          KST 02:05 · UTC 17:05
workflow_dispatch 기준일을 직접 입력하거나 비워서 실행
endpoint          POST /v1/lobby/movie-chart/cron
header            x-cron-secret
secret            CINEMO_CRON_SECRET
```

`CINEMO_CRON_SECRET`의 값은 Railway API의 `CRON_SECRET`과 같아야 한다. API는 `ConfigService`에서 `EnvKeys.CRON_SECRET`을 읽어 헤더와 비교한다.

GitHub Actions는 `runs-on: ubuntu-latest`이므로 workflow 안의 날짜 계산은 Ubuntu 문법인 `date -d`를 사용한다. 로컬 macOS에서 같은 날짜 계산을 직접 실행할 때는 `date -v-1d`가 필요하지만, Actions 실행에는 영향을 주지 않는다.

### MovieChart 수동 확인

자동 예약을 기다리기 전에 배포 API Swagger에서 크론 endpoint를 직접 실행할 수 있다.

```txt
Swagger
  → POST /v1/lobby/movie-chart/cron
  → x-cron-secret 입력
  → targetDate 선택 입력
  → Execute
  → 202 응답과 saved 확인
```

`targetDate`를 비워두면 API가 KST 기준 어제 날짜를 사용한다. 특정 날짜를 확인할 때만 `YYYY-MM-DD` 형식으로 입력한다.

## 개봉일 알림 자동 실행

개봉일 알림은 API 서버 내부의 `@Cron()`이 실행하는 방식이 아니라, GitHub Actions가 배포된 API endpoint를 호출하는 방식이다.

```txt
workflow          .github/workflows/release-notification.yml
schedule          KST 09:00 · UTC 00:00
endpoint          POST /v1/release-notifications/cron
header            x-cron-secret
secret            CINEMO_CRON_SECRET
```

GitHub Secret `CINEMO_CRON_SECRET`의 값은 Railway API의 `CRON_SECRET`과 같아야 한다. API는 `ConfigService`로 `CRON_SECRET`을 읽고 `x-cron-secret` 헤더를 검증한다.

`workflow_dispatch`로 GitHub Actions 화면에서 즉시 수동 실행할 수 있다. Swagger의 같은 endpoint는 로컬·운영 환경에서 발송 로직을 직접 확인할 때 사용한다. 두 방식 모두 API 서버가 배포되어 외부에서 접근 가능해야 하며, 노트북을 닫아도 실행되는 것은 GitHub Actions 쪽이다.

발송 성공 후 `MovieReleaseNotification.sentAt`이 기록되므로 같은 알림이 반복 발송되지 않는다. 대상이 없으면 메일 없이 정상 종료한다.

### MovieChart 자동 수집 기준

- `schedule`: 매일 한 번 실행
- `workflow_dispatch`: 기준일을 지정한 수동 실행
- GitHub Secret: 운영 API 주소와 내부 호출 secret
- API: 관리자 JWT가 아닌 workflow 전용 secret 검증
- DB: `(chartDate, kobisMovieCd)` 유일 제약과 `upsert` 사용
- 실패: HTTP 실패 코드와 응답 본문을 로그에 남기고 workflow를 실패 처리
- 중복 실행: 같은 기준일을 다시 실행해도 결과가 중복되지 않게 처리

```txt
Swagger에서 기준일 1일 수집 검증
  → workflow_dispatch 수동 실행 검증
  → schedule 활성화
  → Actions 로그와 운영 DB 저장 결과 확인
```

기간 백필과 API 확인 방법은 [Swagger 사용 가이드](../api/swagger.md), MovieChart 데이터 구조는 [MovieChart 문서](../lobby/moviechart.md)에서 관리한다.

## 실패 확인 기준

- `Actions → workflow → 실패한 실행 → 실패한 step` 순서로 로그를 확인한다.
- `curl` 호출은 `--fail-with-body --silent --show-error`를 사용해 HTTP 오류와 응답 본문을 함께 확인한다.
- API 로그에서 요청 기준일·처리 건수·실패 원인을 확인한다.
- DB에서 해당 날짜의 Snapshot 수와 중복 여부를 확인한다.
- 원인 수정 후 `Re-run failed jobs` 또는 `workflow_dispatch`로 다시 실행한다.

## 보안 기준

- 관리자 JWT를 GitHub Actions Secret으로 장기간 보관하지 않는다.
- workflow 전용 secret은 최소 권한으로 사용한다.
- 외부 요청을 받는 endpoint와 내부 자동화 endpoint를 구분한다.
- secret이 없는 경우 API가 성공처럼 처리하지 않고 실패시킨다.
- 로그에 URL·응답은 남길 수 있지만 secret 값은 출력하지 않는다.

공식 문서: [Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Secrets 사용](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [수동 workflow 실행](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)

## MoviePool seed

현재는 GitHub Actions가 Railway API의 전용 endpoint를 호출한다. Cloud Scheduler 전환 후에는 `workflow_dispatch`를 수동 fallback으로 남길 수 있다.

```txt
GitHub Actions
  → POST /v1/tmdb/seed-pool/cron
  → Railway API
  → Neon movie_pool_seed_runs 기록
```

실행 시각: KST 02:05 (`UTC 17:05`).

필수 Secret:

```txt
CINEMO_API_URL       Railway API origin만 입력
CINEMO_CRON_SECRET   Railway의 CRON_SECRET과 동일한 값
```

관리자 JWT를 Actions Secret으로 사용하지 않는다.

관리자 화면:

```txt
/admin/ops  수동 시드 실행 · progress polling · 머신별 통계
/admin      가장 최근 cron/manual 실행 결과 모달
```

결과 기록은 `MoviePoolSeedRun`에 저장하며, 관리자별 localStorage key로 이미 확인한 실행을 다시 표시하지 않는다.

시드 실행 중 페이지를 새로고침해도 Railway API 작업은 중단되지 않는다. `/admin/ops` 재진입 시 `/v1/tmdb/seed-pool/progress` polling으로 진행 상태를 복원한다.

중단 endpoint:

```txt
POST /v1/tmdb/seed-pool/cancel
  → 현재 프로세스의 seedCancelRequested 설정
  → 다음 page/movie 경계에서 전체 시드 종료
  → 실행 잠금 해제
```

### MoviePool seed DB 오류

증상:

```txt
500 {"statusCode":500,"message":"데이터베이스 오류가 발생했습니다."}
```

Neon의 `MoviePoolSeedRun` migration 미적용 상태에서 발생. 해결 후 GitHub Actions 재실행.

```bash
pnpm --filter api exec prisma migrate deploy
```

### MoviePool seed 401

증상:

```txt
401 {"message":"로그인이 필요합니다.","error":"Unauthorized","statusCode":401}
```

`POST /v1/tmdb/seed-pool/cron`은 `@Public()`으로 JWT guard를 통과하지만 `x-cron-secret` 헤더와 Railway의 `CRON_SECRET`은 계속 비교.

GitHub Actions Secret `CINEMO_CRON_SECRET`과 Railway Variable `CRON_SECRET`의 동일한 값 등록 필요.

## Portfolio demo activity seed

운영 전 포트폴리오 화면에 활동 데이터가 보이도록 Railway DB에 demo 데이터 생성. 실제 회원과 구분하기 위해 이메일 도메인은 `demo.cinemo.invalid`로 고정.

```txt
초기 1회       GitHub Actions workflow_dispatch · days=7
매일           KST 02:30 · days=1
endpoint       POST /v1/admin/demo-seed?days=N
secret header  x-demo-seed-secret
```

Railway Variables:

```txt
DEMO_SEED_ENABLED=1
DEMO_SEED_SECRET=GitHub Actions의 CINEMO_DEMO_SEED_SECRET과 동일한 32자 이상 값
DEMO_SEED_PASSWORD=demo 계정 공통 로그인 비밀번호 · 8자 이상
```

생성 범위:

```txt
신규 demo 유저 · 재방문 login · LobbyVisit
Ticket issued/used · 랜덤 MoviePool 영화
AdminDailyStat · AdminHourlyStat · UserMovie
```

삭제:

```bash
curl --fail-with-body --request DELETE \
  --url "$CINEMO_API_URL/v1/admin/demo-seed" \
  --header "x-demo-seed-secret: $CINEMO_DEMO_SEED_SECRET"
```

삭제 endpoint는 demo FK 데이터만 삭제하고 영향받은 일별·시간대 통계를 실제 DB 데이터로 재계산. `DEMO_SEED_ENABLED=0`만 설정하면 새 생성은 막히지만 기존 demo 데이터는 남으므로 완전 삭제에는 DELETE 실행.
