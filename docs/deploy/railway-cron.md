# Railway Cron 검토 결과

## 현재 결정

현재 CINEMO는 Railway Cron을 사용하지 않음.

```txt
현재 예약 실행       → GitHub Actions
장기 확장 방향       → Cloud Scheduler + Cloud Run Job
Railway Cron         → 비교·보류
```

Railway Cron 자체가 잘못된 방식은 아니지만, 지금 도입하면 예약 실행 플랫폼을 Railway에 고정하게 됨. 이후 작업이 많아지고 재시도·IAM 인증·실행 이력·작업별 격리가 중요해질 때 Cloud Scheduler와 Cloud Run Job 조합을 검토하는 편이 CINEMO의 장기 방향에 맞음.

## Railway Cron의 특징

- Railway 서비스의 Start Command를 정해진 시간에 실행함
- 작업이 끝나면 프로세스가 종료되어야 함
- 스케줄은 UTC 기준임
- 이전 실행이 끝나지 않으면 다음 실행이 건너뛰어질 수 있음
- 최소 실행 간격은 5분임

자세한 동작은 [Railway Cron 공식 문서](https://docs.railway.com/cron-jobs) 참고.

## 사용하지 않는 이유

- 현재 GitHub Actions 예약 실행이 이미 동작함
- Railway Cron을 추가해도 MovieChartSnapshot의 데이터 모델·저장 로직 문제가 해결되는 것은 아님
- 장기적으로 Cloud Scheduler의 시간대·재시도·IAM 인증을 활용할 계획임
- 두 예약 시스템을 동시에 활성화하면 중복 실행 위험이 있음

## 나중에 재검토할 조건

- Cloud 프로젝트와 Cloud Run 운영 비용·권한 관리가 부담스러울 때
- 작업이 Railway 내부 DB·API에만 한정되고 별도 실행 환경이 필요 없을 때
- Cloud Scheduler 도입보다 Railway 내 단일 운영이 더 단순하다고 판단될 때

Railway Cron을 선택하더라도 job은 특정 플랫폼에 종속되지 않는 일회성 실행 구조로 작성해야 함.
