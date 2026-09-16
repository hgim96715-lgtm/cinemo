# 제거한 기능

## 뽑기방·티켓

- 로비의 티켓 창구와 티켓 stub UI 제거
- `/gacha` 화면과 관련 CSS·API 요청 함수 제거
- `Ticket` Prisma 모델과 `TicketStatus` enum 제거
- 관리자 티켓 카드·티켓 통계 차트 제거
- 관리자 MoviePool 시드 화면·진행 모달 제거
- MoviePool 시드 전용 API와 실행 이력 모델 제거
- `MoviePool`은 영화 메타데이터 캐시로 유지

## 데이터베이스 정리

`20260916100000_remove_gacha_feature` migration에서 다음 항목을 삭제함.

- `tickets` 테이블
- `TicketStatus` enum
- `admin_daily_stats.tickets_issued`
- `admin_daily_stats.tickets_used`
- `movie_pool_seed_runs` 테이블
- MoviePool 시드 상태 enum

기존 기능을 되살릴 계획이 생기면 삭제 migration을 되돌리는 대신 새로운 모델과 API를 다시 설계함.
