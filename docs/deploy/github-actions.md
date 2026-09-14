# GitHub Actions

> [!note]
> 현재 예약 실행의 기본 위치는 GitHub Actions임. 장기적으로는 Cloud Scheduler가 Cloud Run Job을 호출하는 구조를 검토함. Daily Excel artifact와 수동 실행은 GitHub Actions를 계속 사용함.

## MoviePool seed

현재는 GitHub Actions가 Railway API의 전용 endpoint를 호출함. Cloud Scheduler 전환 후에는 `workflow_dispatch`를 수동 fallback으로 남길 수 있음.

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

관리자 JWT를 Actions Secret으로 사용하지 않음.

관리자 화면:

```txt
/admin/ops  수동 시드 실행 · progress polling · 머신별 통계
/admin      가장 최근 cron/manual 실행 결과 모달
```

결과 기록은 `MoviePoolSeedRun`에 저장하며, 관리자별 localStorage key로 이미 확인한 실행을 다시 표시하지 않음.

시드 실행 중 페이지를 새로고침해도 Railway API 작업은 중단되지 않음. `/admin/ops` 재진입 시 `/v1/tmdb/seed-pool/progress` polling으로 진행 상태 복원.

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

## Daily Excel report

MoviePool seed와 같은 방식으로 GitHub Actions가 Railway API를 호출. 로컬 컴퓨터 절전 여부와 무관하게 실행되며, API는 생성 결과를 `AdminDailyReport`에 저장.

```txt
workflow  .github/workflows/daily-admin-excel.yml
시각      KST 02:00 = UTC 17:00
endpoint  POST /v1/admin/reports/daily-excel/cron
header    x-cron-secret: ${{ secrets.CINEMO_CRON_SECRET }}
결과      xlsx binary → reports/YYYY/MM/cinemo-YYYY-MM-DD.xlsx
보관      GitHub Actions artifact · retention-days: 90
```

필수 Secrets:

```txt
CINEMO_API_URL       Railway API origin만 입력
                     예: https://api.example.com
                     /v1를 중복해서 붙이지 않음
CINEMO_CRON_SECRET   Railway의 CRON_SECRET과 동일한 값
```

상태 조회:

```txt
GET /v1/admin/reports/daily-excel/status
→ { report: null }                     아직 실행 기록 없음
→ { report: { status: 'running' } }    생성 중
→ { report: { status: 'succeeded' } }  생성 완료·건수 확인 가능
→ { report: { status: 'failed' } }     errorMessage 확인
```

주의:

- `AdminDailyReport`는 통계 카운터가 아닌 Excel 실행 원장
- API가 `null`을 직접 반환하면 `200 + 빈 body`가 될 수 있으므로 `{ report: null }` 형태 유지
- 상태 조회는 JSON이라 `apiFetch` 사용
- Excel 다운로드는 binary라 `response.blob()` 사용
- artifact는 현재 90일 보관. 영구 보관은 별도 object storage 연동 대상

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
