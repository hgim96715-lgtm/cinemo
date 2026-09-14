# 배포 전 체크리스트

## API

```bash
pnpm --filter api build
```

- Prisma Client 생성 단계 선행
- TypeScript build 성공
- Railway `DATABASE_URL`이 Neon을 가리키는지 확인
- Neon에 migration 적용
- `/health` 응답 확인

## Web

```bash
pnpm --filter web build
```

- `useSearchParams()` 사용 페이지에 Suspense 경계 존재
- `NEXT_PUBLIC_API_URL`이 Railway API 주소
- Vercel 배포 도메인에서 로그인·회원가입 요청 확인

## MoviePool seed

- GitHub Actions Secret의 `CINEMO_API_URL`이 Railway API origin
- GitHub Actions Secret의 `CINEMO_CRON_SECRET`과 API의 `CRON_SECRET` 일치
- `POST /v1/tmdb/seed-pool/cron` 응답 확인
- `/admin/ops`에서 진행 상태와 머신별 통계 확인
- `MoviePoolSeedRun`에 실행 결과 저장 확인

## Demo activity seed

- GitHub Actions Schedule: `30 17 * * *` (KST 02:30)
- GitHub Actions Secret의 `CINEMO_API_URL`이 Railway API origin
- `CINEMO_DEMO_SEED_SECRET`이 API의 `DEMO_SEED_SECRET`과 일치
- API의 `DEMO_SEED_ENABLED=1` 확인
- `POST /v1/admin/demo-seed?days=1` 응답 확인

## Daily Excel report

- workflow 파일: `.github/workflows/daily-admin-excel.yml`
- 실행 시각: KST 02:00 = UTC 17:00
- endpoint: `POST /v1/admin/reports/daily-excel/cron`
- `AdminDailyReport` 상태 확인
- xlsx artifact 생성과 90일 보관 확인

## Cloud Scheduler 전환 준비

- [Cloud Scheduler 문서](./cloud-scheduler.md)의 실행 구조 확인
- Cloud Run Job이 작업 완료 후 종료되는지 확인
- Scheduler 재시도에 대비해 job이 멱등적인지 확인
- Cloud Scheduler 전환 전까지 기존 GitHub Actions `schedule` 유지
- 전환 후에도 GitHub Actions `workflow_dispatch` 수동 실행 유지

## 공통 점검

- Railway API의 `/v1/health` 정상 응답
- Vercel Production 환경변수 최신 값 확인
- 새 환경변수 저장 후 Redeploy 완료
- Railway의 `PORT`, Service Domain Target Port, NestJS listen port 일치
- 로컬 주소를 배포 환경 변수에 입력하지 않음
