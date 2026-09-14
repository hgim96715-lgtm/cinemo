# Ticket

- 테이블: `tickets`
- 목적: 사용자의 날짜별 영화 뽑기 이용권

## 관계 요약

```mermaid
erDiagram
  USER ||--o{ TICKET : receives
```

`tmdbId`로 `MoviePool`과 논리적으로 연결되며 DB 외래 키는 아님.

## 주요 필드

| 필드 | 설명 |
|---|---|
| `id` | UUID 기본 키 |
| `userId` | 사용자 외래 키 |
| `ticketDate` | 티켓 기준 날짜, PostgreSQL `date` |
| `machineId` | 사용한 뽑기 머신 |
| `tmdbId` | 선택된 영화 |
| `status` | `issued` 또는 `used` |
| `issuedAt`, `usedAt` | 발급·사용 시각 |

## 제약

사용자별 같은 날짜에 티켓 하나만 허용: `(userId, ticketDate)` unique.
