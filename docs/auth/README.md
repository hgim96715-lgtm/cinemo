# Authentication

로그인·세션·사용자 인증 상태 문서.

## 문서 목록

| 문서 | 내용 |
| --- | --- |
| [auth-store.md](./auth-store.md) | Zustand 인증 상태·세션·프로필 갱신 |
| [guards.md](./guards.md) | JWT 인증 Guard·역할 인가 Guard·공개 endpoint |
| [session-strategy.md](./session-strategy.md) | Access Token·Refresh Token 저장 전략과 migration |

## 구현 영역

| 영역 | 위치 |
| --- | --- |
| Web 인증 상태 | `apps/web/lib/auth-store.ts` |
| Web 세션 복원 | `apps/web/components/auth/AuthBootstrap.tsx` |
| Web 인증 API | `apps/web/lib/auth-api.ts` |
| API 인증 모듈 | `apps/api/src/auth/` |

인증 UI와 세션 상태를 분리하고, API 요청에는 store의 `accessToken`만 전달하는 구조.
