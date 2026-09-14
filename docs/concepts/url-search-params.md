# URL 쿼리 상태와 `useSearchParams`

Next.js App Router에서 URL의 query string을 React 상태와 연결하는 기준.

현재 적용 화면:

- Web: `apps/web/app/upcoming/page.tsx`
- 예시 URL: `/upcoming?month=2026-10`

## 기본 원칙

브라우저 URL을 직접 읽거나 수정하지 않고 Next.js의 navigation API를 사용함.


| 목적              | 사용 API                                        |
| --------------- | --------------------------------------------- |
| query 읽기        | `useSearchParams()`                           |
| URL 이동·query 변경 | `router.replace()` 또는 `router.push()`         |
| 화면 상태 동기화       | `searchParams.get()` 결과를 `useEffect`에서 상태에 반영 |


## `useSearchParams()`

`useSearchParams()`는 현재 URL의 query string을 읽는 읽기 전용 객체를 반환함.

```tsx
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const month = searchParams.get('month');
```

값이 없으면 `null`을 반환함.

```ts
const month = searchParams.get('month');

if (month === null) {
  // query가 없는 상태
}
```



## query를 변경하는 방법

`ReadonlyURLSearchParams`를 직접 수정하지 않고 문자열로 복사한 뒤 `URLSearchParams`에서 변경함.

```tsx
function handlePeriodChange(period: string) {
  const params = new URLSearchParams(searchParams.toString());

  if (period === 'all') {
    params.delete('month');
  } else {
    params.set('month', period);
  }

  const query = params.toString();

  router.replace(query ? `/upcoming?${query}` : '/upcoming');
}
```



### `replace()`와 `push()`

- `router.replace()`: 필터·정렬처럼 현재 화면의 query만 바꿀 때 사용. 뒤로 가기 기록을 불필요하게 추가하지 않음
- `router.push()`: 사용자가 새로운 화면으로 이동했다고 볼 수 있는 경우 사용

개봉 예정 영화의 월 필터는 같은 페이지 안의 조건만 바꾸므로 `router.replace()`를 사용함.

## URL을 화면 상태의 기준으로 사용

필터 상태를 버튼 클릭에서 직접 변경하지 않고 URL 변경 결과를 읽어 상태를 갱신함.

```tsx
useEffect(() => {
  const month = searchParams.get('month');

  setSelectedPeriod(
    month && periods.some((period) => period.key === month) ? month : 'all',
  );
}, [searchParams]);
```

이 구조의 흐름:

```txt
탭 클릭
  → router.replace()
  → URL query 변경
  → useSearchParams() 값 변경
  → useEffect 실행
  → selectedPeriod 갱신
  → 목록 API 재조회
```

따라서 `handlePeriodChange()` 안에서 다음 코드를 중복 호출하지 않음.

```tsx
setSelectedPeriod(period);
```

URL과 React 상태를 각각 별도로 변경하면 동일한 변경이 두 번 발생하고, 상태의 기준이 무엇인지 불명확해짐.

## 사용하지 않는 방식



### `window.location.search` 직접 읽기

```tsx
const params = new URLSearchParams(window.location.search);
```

현재 URL을 한 번 읽을 수는 있지만, URL 변경을 React가 추적하는 흐름과 분리됨. query가 바뀌어도 해당 코드가 다시 실행된다는 보장이 없어 화면 상태 동기화에 적합하지 않음.

### `window.history.replaceState()` 직접 호출

```tsx
window.history.replaceState(null, '', `/upcoming?${query}`);
```

브라우저 URL은 바뀌지만 Next.js Router의 navigation 흐름과 분리됨. 서버 컴포넌트·레이아웃·라우팅 상태가 함께 갱신되어야 하는 경우 예측하기 어려운 상태가 될 수 있음.

### 읽기 전용 객체 직접 수정

```tsx
searchParams.set('month', period); // 사용하지 않음
```

`useSearchParams()`가 반환하는 객체는 읽기 전용임. `toString()`으로 복사한 뒤 새 `URLSearchParams`를 만들어 수정해야 함.

## 예외와 주의사항

- `useSearchParams()`는 Client Component에서 사용함
- 정적 렌더링 경로에서 사용할 때는 `Suspense` 경계 안에서 사용함
- query 값은 항상 문자열이므로 날짜·페이지·ID는 사용 전에 형식 검증이 필요함
- 허용하지 않은 `month` 값은 기본값인 `all`로 보정함
- query 변경 후 목록 조회 effect가 실행되므로 클릭 핸들러에서 목록 API를 직접 다시 호출하지 않음
- `window` 접근은 브라우저 전용 기능이 꼭 필요한 경우에만 사용함



## `Suspense` 경계가 필요한 이유

`useSearchParams()`는 현재 URL의 query를 브라우저에서 읽는 Client Component hook임. 정적으로 생성할 수 있는 페이지에서 이 hook을 사용하면 Next.js가 해당 부분을 클라이언트 렌더링으로 전환하는 CSR bailout이 발생함.

이때 페이지 트리 상위에 `Suspense` 경계가 없으면 Vercel production build에서 다음 오류가 발생함.

```txt
useSearchParams() should be wrapped in a suspense boundary at page "/postcard"
```



### 적용 패턴

hook을 사용하는 실제 화면을 `Content` 컴포넌트로 분리하고, 기본 export에서 `Suspense`로 감쌈.

```tsx
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PageContent() {
  const searchParams = useSearchParams();

  return <p>{searchParams.get('month')}</p>;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
```

현재 적용 화면:

- `apps/web/app/postcard/page.tsx`
- `apps/web/app/upcoming/page.tsx`

페이지 본문뿐 아니라 그 하위 컴포넌트에서 `useSearchParams()`를 사용하더라도, 해당 컴포넌트 전체가 `Suspense` 경계 안에 포함되어야 함. `fallback`은 prerender 중 표시할 UI이며, 실제 화면의 로딩 UI가 별도로 있으면 같은 레이아웃을 유지하는 fallback을 사용함.

### CINEMO 적용 구조

`/postcard`는 Vercel prerender 오류를 피하기 위해 페이지 진입점과 Client Component를 파일로 분리함.

```txt
apps/web/app/postcard/
├─ page.tsx                 # Server Component: Suspense 경계
└─ PostcardPageContent.tsx  # Client Component: 브라우저 상태·query 사용
```

```tsx
// app/postcard/page.tsx
import { Suspense } from 'react';
import { PostcardPageContent } from './PostcardPageContent';

export default function PostcardPage() {
  return (
    <Suspense fallback={null}>
      <PostcardPageContent />
    </Suspense>
  );
}
```

`PostcardPageContent`와 그 하위의 댓글·반응 컴포넌트가 `useSearchParams()`를 사용함. 따라서 hook을 사용하는 Client Component를 Server Component의 `Suspense` 내부에 배치하는 구조가 기준임.

### 오류 구분

- `useSearchParams() should be wrapped in a suspense boundary`: query hook과 Suspense 경계 구조 문제
- `next/font`의 Google Fonts fetch 오류: 빌드 환경의 외부 네트워크·폰트 접근 문제

두 오류는 원인이 다르므로 `next/font` 네트워크 오류를 query prerender 오류의 수정 여부와 혼동하지 않음.

### 안티 패턴

```tsx
export default function Page() {
  const searchParams = useSearchParams();

  return <PageContent searchParams={searchParams} />;
}
```

페이지 export 자체에서 hook을 호출하고 `Suspense`를 내부에 두면 hook 호출이 경계 바깥에서 실행되므로 오류가 해결되지 않음. hook 호출 컴포넌트와 `Suspense` 위치를 분리해야 함.

## 선택 기준

```txt
URL query를 읽어야 함       → useSearchParams()
URL query를 변경해야 함     → router.replace() / router.push()
브라우저 전용 API가 필요함  → 필요한 범위에서만 window 사용
```

