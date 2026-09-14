# Dialog·Modal 접근성 기준

## 목적

모달은 화면 위에 새로운 작업 영역을 띄우는 UI임. 단순히 `div`를 겹쳐 그리는 것만으로는 키보드 사용자와 스크린 리더 사용자를 충분히 지원하기 어려움.

모달에는 다음 동작이 함께 필요함.

- 열릴 때 모달 내부로 focus 이동
- 모달이 열린 동안 모달 밖으로 focus가 빠져나가지 않도록 제한
- `Esc`로 닫기
- 배경 클릭으로 닫기
- 닫힌 뒤 모달을 열었던 요소로 focus 복원
- `role="dialog"`, `aria-modal`, 제목·설명 연결
- 모달이 열려 있는 동안 배경 스크롤 제어

## 라이브러리 선택

직접 focus trap을 구현하기보다 검증된 Dialog primitive를 사용하는 방향을 권장함.


| 선택지                      | 담당 범위                             | CINEMO 적합성              |
| ------------------------ | --------------------------------- | ----------------------- |
| `focus-trap`             | focus 이동 제한 중심                    | 나머지 접근성 동작을 직접 구현해야 함   |
| `@radix-ui/react-dialog` | focus, ESC, 바깥 클릭, ARIA, Portal 등 | 현재 CSS 중심 구조와 잘 맞음      |
| Headless UI Dialog       | 접근성 Dialog + Tailwind 친화적 스타일링    | Tailwind 중심 프로젝트에 더 적합함 |


현재 CINEMO는 Tailwind class보다 전역 CSS 파일을 중심으로 스타일을 관리하므로 `@radix-ui/react-dialog`를 우선 선택함.

참고: [Radix Dialog 공식 문서](https://www.radix-ui.com/primitives/docs/components/dialog)

## 현재 적용 범위

현재 확인된 실제 모달 UI에 적용함.

```txt
apps/web/components/moviechart/MovieChartTrailerModal.tsx
  └─ @radix-ui/react-dialog
     ├─ Dialog.Root
     ├─ Dialog.Portal
     ├─ Dialog.Overlay
     ├─ Dialog.Content
     ├─ Dialog.Title
     └─ Dialog.Close

공통 영상 모달:

```txt
apps/web/components/common/MovieVideoModal.tsx
  └─ Dialog.Portal · Overlay · Content · Title · Close
```

`MovieVideoModal`은 영상 URL을 받아 예고편·티저 iframe, 로딩 Skeleton, 재생 차단 시 YouTube 썸네일 fallback을 공통 처리함.

- `MovieChartTrailerModal`은 영화차트용 `Dialog.Root`와 공통 영상 모달을 연결함
- `MovieDetailModal`의 `예고편 보기`·`티저 보기` 버튼도 `Dialog.Trigger asChild`로 같은 영상 모달을 엶
- 상세 정보 모달과 영상 모달은 별도의 `Dialog.Root`를 사용함

apps/web/components/common/ConfirmModal.tsx
  └─ @radix-ui/react-dialog
     ├─ Dialog.Root
     ├─ Dialog.Portal
     ├─ Dialog.Overlay
     ├─ Dialog.Content
     ├─ Dialog.Title
     ├─ Dialog.Description
     └─ Dialog.Close

그 외 적용 컴포넌트:

- `apps/web/components/lobby/LobbyGuideModal.tsx`
- `apps/web/components/my-cinema/MovieCalendarModal.tsx`
- `apps/web/components/my-cinema/MovieDetailModal.tsx`
- `apps/web/components/my-cinema/PosterPickerModal.tsx`
- `apps/web/components/my-cinema/ProfileModal.tsx`
- `apps/web/components/my-cinema/WardrobeModal.tsx`
- `apps/web/components/my-cinema/WatchedDateEditModal.tsx`
- `apps/web/components/postcard/PostcardCreateModal.tsx`
- `apps/web/app/gacha/page.tsx`의 뽑기 결과 모달
- `apps/web/app/my-cinema/postcard/page.tsx`의 엽서 상세 모달

```

관련 스타일은 페이지 CSS와 분리함.

```txt
apps/web/app/styles/moviechart-modal.css
```

추가 이모지 선택창(`PostcardReactionBar`)과 달력 연·월 선택 메뉴(`CalendarPeriodSelect`)는 전체 화면을 막는 모달이 아니라 팝오버·listbox이므로 Dialog 대상에서 제외함.

## 기본 사용 패턴

```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Portal>
    <Dialog.Overlay className="dialog-overlay" />
    <Dialog.Content
      className="dialog-content"
      aria-describedby={undefined}
    >
      <Dialog.Close asChild>
        <button type="button" aria-label="닫기">
          닫기
        </button>
      </Dialog.Close>

      <Dialog.Title>모달 제목</Dialog.Title>
      {/* 설명이 있으면 Dialog.Description을 사용함 */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

`Dialog.Root`의 `open`과 `onOpenChange`를 부모 상태와 연결함. 닫기 버튼, `Esc`, 배경 클릭으로 닫힐 때 모두 `onOpenChange(false)`를 통해 같은 닫기 흐름을 사용함.

## `Dialog.Trigger`와 focus 복원

모달을 여는 버튼이 JSX 트리 안에 존재한다면 `Dialog.Trigger asChild`로 실제 버튼을 감싸야 함.

```tsx
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild>
    <button type="button" onClick={loadDetail}>
      상세 보기
    </button>
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Close asChild>
        <button type="button">닫기</button>
      </Dialog.Close>
      <Dialog.Title>상세 정보</Dialog.Title>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

`Dialog.Trigger`와 `Dialog.Content`가 같은 `Dialog.Root`에 있어야 Radix가 실제 opener를 기억하고, 모달이 닫힌 뒤 원래 버튼으로 focus를 복원할 수 있음. `Dialog.Content` 안에 Trigger를 새로 넣는 방식은 모달을 연 외부 버튼과 연결되지 않으므로 사용하지 않음.

현재 `/upcoming`의 상세 모달은 상세 API 응답 전에 Skeleton을 표시해야 하므로, 영화 카드별 `Dialog.Root`를 먼저 렌더링하고 `Dialog.Trigger`로 상세 버튼을 연결함. 상세 정보가 도착하면 같은 Root 안에서 `MovieDetailModalSkeleton`이 `MovieDetailModal`로 교체됨.

조건부로 늦게 마운트되는 모달은 `onOpenAutoFocus`·`onCloseAutoFocus`만으로 opener focus 복원이 보장되지 않음. 이 경우 Root와 Trigger를 부모로 올리는 구조로 변경해야 함.

## 직접 구현 코드와의 차이

기존 직접 구현 방식에서는 다음 기능을 각각 관리해야 함.

```tsx
document.addEventListener('keydown', handleKeyDown);
closeButtonRef.current?.focus();
previousActiveElementRef.current?.focus();
document.body.style.overflow = 'hidden';
```

Radix Dialog를 사용하면 Dialog의 구조와 접근성 동작을 primitive에 위임할 수 있음. 따라서 모달 컴포넌트는 영화차트의 예고편 상태, 썸네일 fallback, 화면 스타일 같은 제품 기능에 집중함.

## 사용 기준

- 새로 만드는 복잡한 모달은 Radix Dialog를 우선 검토함
- 단순한 인라인 팝오버는 Dialog로 감싸지 않음
- 이미 동작 중인 기존 모달은 기능 수정과 함께 점진적으로 migration함
- `Dialog.Title`은 반드시 제공함
- 설명이 있으면 `Dialog.Description`을 제공함
- 설명이 없는 경우에만 `aria-describedby={undefined}`를 명시함
- `Dialog.Portal`로 모달을 일반 콘텐츠와 분리해 stacking context 충돌을 줄임
- 스타일은 각 기능의 CSS 파일에서 관리하고 Dialog primitive에 스타일을 종속시키지 않음



## 도입 시 주의점

- Radix를 한 모달에만 적용하면 기존 직접 구현 모달과 패턴이 섞임
- 라이브러리를 추가하는 것만으로 제품별 상태 처리까지 해결되지는 않음
- `iframe` 로딩, 썸네일 fallback, 오류 메시지 등 도메인 상태는 별도로 관리해야 함
- 모달 안의 `iframe`이나 외부 링크가 focus 순서를 방해하지 않는지 실제 키보드로 확인해야 함



## 영상 모달 재생 정책

영상 모달은 열자마자 자동 재생하지 않고, iframe 안의 YouTube 재생 버튼을 사용자가 클릭해야 재생함.

자동 재생을 사용하지 않는 이유:

- 모달을 여는 순간 예상하지 못한 소리가 재생되는 것을 방지함
- 모바일 브라우저의 자동 재생 제한을 피함
- 사용자의 명확한 재생 의도를 보장함
- 영상 iframe이 로드되는 동안 Skeleton과 실제 콘텐츠의 전환이 안정적임

현재 iframe의 `loading="eager"`는 영상을 자동 재생한다는 뜻이 아님. iframe 리소스를 우선 로드하는 설정이며, 실제 영상 재생은 사용자가 YouTube 플레이어를 클릭할 때 시작됨.

자동 재생이 필요한 제품 요구사항이 생기면 `autoplay=1&mute=1` 방식의 무음 자동 재생만 검토함. 소리가 있는 자동 재생은 브라우저 정책과 UX 문제 때문에 기본값으로 사용하지 않음.

## 설치

웹 앱 workspace에 직접 의존성으로 추가함.

```bash
pnpm --filter web add @radix-ui/react-dialog
```

