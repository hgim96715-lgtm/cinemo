# Cloud Scheduler + Cloud Run Job

## CINEMO의 장기 예약 실행 방향

현재는 GitHub Actions가 예약 작업을 실행함. 작업이 많아지고 운영 안정성이 중요해지면 Cloud Scheduler가 Cloud Run Job을 호출하는 구조로 확장함.

```txt
Cloud Scheduler
  → Cloud Run Job
  → KOBIS·TMDB 조회
  → Neon PostgreSQL 저장
  → 작업 종료
```

Cloud Scheduler는 실행 시각과 재시도를 관리하고, Cloud Run Job은 작업을 완료한 뒤 종료되는 실행 환경을 담당함. [Cloud Scheduler 공식 문서](https://docs.cloud.google.com/scheduler/docs/overview), [Cloud Run Jobs 공식 문서](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run)

## 작업별 적용 방향

```txt
MovieChartSnapshot  → 매일 KOBIS 조회·순위 snapshot 저장
MoviePool seed      → MoviePool 갱신
개봉일 알림         → 대상 조회·메일 발송
Daily Excel         → artifact가 필요하므로 당분간 GitHub Actions 유지
```

## 코드 작성 기준

job은 GitHub Actions, Railway Cron, Cloud Run Job 중 어디서 실행해도 동작하도록 플랫폼과 분리함.

```txt
MovieChartSnapshotService  실제 조회·저장 use case
CLI 또는 Job entrypoint    한 번 실행하고 종료
Scheduler                  실행 시각만 담당
```

필수 조건:

- `chartDate + kobisMovieCd` 기준 `upsert`
- 같은 요청이 재실행되어도 데이터가 망가지지 않는 멱등성
- 정상 완료 시 exit code `0`
- 실패 시 exit code `1`
- Prisma·HTTP·외부 API 연결 정리 후 종료
- API key와 DB 접속 정보는 Secret·환경변수로 주입

Cloud Scheduler는 최소 한 번 실행 방식이므로 같은 작업이 중복 호출될 수 있음. 따라서 날짜·영화 코드·작업 실행 ID를 기준으로 중복 저장을 막아야 함.

## 시간대

Cloud Scheduler에서는 시간대를 `Asia/Seoul`로 직접 선택할 수 있음. UTC로 고정할 경우 KST에서 9시간을 빼서 계산함. [Cloud Scheduler 시간대 문서](https://docs.cloud.google.com/scheduler/docs/configuring/cron-job-schedules)

예시:

```txt
KST 매일 02:30
→ Asia/Seoul 시간대: 30 2 * * *
→ UTC 시간대:       30 17 * * *
```

## 전환 순서

```txt
1. GitHub Actions에서 job 동작과 DB 결과 확인
2. Cloud Run Job 이미지·환경변수 구성
3. Cloud Scheduler에서 Cloud Run Job 호출 설정
4. Service Account에 Cloud Run Invoker 권한 부여
5. 수동 실행으로 로그·snapshot·실패 재시도 확인
6. Cloud Scheduler schedule 활성화
7. GitHub Actions schedule 제거
8. GitHub Actions workflow_dispatch는 수동 fallback으로 유지
```

전환 전까지는 기존 GitHub Actions 예약 실행을 끄지 않음. 두 시스템을 동시에 활성화하면 같은 날짜의 snapshot·seed·메일이 중복 실행될 수 있음.
