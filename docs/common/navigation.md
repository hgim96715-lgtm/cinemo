# CinemoNav

경로: `apps/web/components/common/CinemoNav.tsx`

로비와 주요 기능 화면 사이의 이동을 담당하는 공통 네비게이션.

왼쪽에 `CINEMO LOBBY` 링크를 기본 제공하고, 화면별로 필요한 경우 오른쪽 이동 링크를 추가하는 구조.

## 기본 동작

- 기본 로비 링크: `CINEMO LOBBY` → `/`
- `showRightLink` 기본값: `false`
- 기본 상태: 로비 링크만 표시
- `showRightLink={true}`와 오른쪽 링크 props 전달 시 오른쪽 링크 표시
- 현재 경로와 오른쪽 링크 경로가 같을 때 `aria-current="page"` 적용
- 오른쪽 링크의 경로, 문구, 접근성 라벨 변경 가능
- `rightHref`, `rightLabel`이 없는 상태에서는 오른쪽 링크를 표시하지 않음

## 사용 예시

```tsx
import { CinemoNav } from '@/components/common/CinemoNav';

<CinemoNav />;

<CinemoNav
  showRightLink
  rightHref="/my-cinema/postcard"
  rightLabel="MY POSTCARD"
  rightAriaLabel="MY POSTCARD로 이동"
/>;
```

## 적용 화면

| 화면 | 오른쪽 링크 |
| --- | --- |
| `postcard` | `MY POSTCARD` → `/my-cinema/postcard` |
| `upcoming` | `찜한 영화` |
| `my-cinema` | 기본값: 오른쪽 링크 없음 |
| `my-cinema/watched` | `MY CINEMA` |
| `my-cinema/postcard` | `CINEMO POSTCARD` → `/postcard` |
| `my-cinema/wish` | 기본값: 오른쪽 링크 없음 |
| `gacha` | 오른쪽 링크 없음 |

관리자 화면과 로그인 화면은 화면 목적과 인증 흐름이 달라 `CinemoNav` 대신 기존 전용 네비게이션을 사용함.

## Props

| Prop | 기본값 | 용도 |
| --- | --- | --- |
| `showRightLink` | `false` | 오른쪽 링크 표시 여부 |
| `rightHref` | 없음 | 오른쪽 링크 경로 |
| `rightLabel` | 없음 | 오른쪽 링크 문구 |
| `rightAriaLabel` | 없음 | 오른쪽 링크 접근성 라벨 |

오른쪽 링크 표시 시 `rightHref`와 `rightLabel`을 함께 전달함. 실제 로비 경로는 `/`를 사용하고 임의의 fallback 경로를 만들지 않음.
