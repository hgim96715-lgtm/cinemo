# Vercel

## 배포 주소

```txt
https://cinemo-six.vercel.app
```

## `useSearchParams()` prerender 오류

증상:

```txt
Error occurred prerendering page "/login"
useSearchParams() should be wrapped in a suspense boundary at page "/postcard"
```

원인:

- Next.js App Router가 페이지를 정적으로 생성하는 중 Client Component에서 `useSearchParams()` 사용
- 해당 hook의 CSR bailout을 감싸는 `Suspense` 경계 부재

해결 패턴:

```tsx
function LoginForm() {
  const searchParams = useSearchParams();
  // ...
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
```

실제 적용:

- `apps/web/app/postcard/page.tsx`의 `PostcardPageContent`
- `apps/web/app/upcoming/page.tsx`의 `UpcomingPageContent`

`useSearchParams()`를 페이지 본문에서 직접 호출하지 않고 `Content` 컴포넌트로 분리한 뒤, 기본 export에서 전체 본문을 `Suspense`로 감쌈. 하위 댓글·반응 컴포넌트가 같은 hook을 사용해도 상위 경계 안에 포함되므로 별도 경계를 추가하지 않아도 됨.

자세한 query 상태 관리 규칙은 [URL query와 `useSearchParams`](../concepts/url-search-params.md) 참고.

## `@cinemo/shared` 모듈 해석 오류

증상:

```txt
Module not found: Can't resolve '@cinemo/shared'
```

원인:

- `apps/web`과 `apps/api`가 `packages/shared`를 `workspace:*`로 사용
- `packages/shared/package.json`의 `main`과 `types`가 `dist/index.js`, `dist/index.d.ts`를 참조
- `dist/`는 `.gitignore` 대상
- Vercel의 깨끗한 빌드에서 shared 패키지 선행 빌드 없이 Next.js 실행

해결:

```json
// apps/web/package.json
{
  "scripts": {
    "build": "pnpm --filter @cinemo/shared build && next build --webpack"
  }
}
```

루트에서도 Vercel이 사용할 수 있도록 Web 빌드 스크립트 제공.

```json
// package.json
{
  "scripts": {
    "build": "pnpm --filter web build"
  }
}
```

Next.js workspace 패키지 처리:

```ts
// apps/web/next.config.ts
const nextConfig = {
  transpilePackages: ['@cinemo/shared'],
};
```

Vercel 설정:

```txt
Root Directory: apps/web
Build Command: pnpm build
```

`next build` 직접 실행 시 shared 선행 빌드가 빠질 수 있으므로 `pnpm build` 사용. 수정 후 새 배포 또는 Redeploy 필요.

## 환경변수

Vercel Web 서비스에 공개 API 주소 등록.

```env
NEXT_PUBLIC_API_URL=https://api-production-8ac7.up.railway.app
```

`localhost:3050`은 Vercel 서버·브라우저에서 로컬 개발 컴퓨터를 의미하지 않음. 배포 Web에서 Railway API로 요청하려면 공개 HTTPS API 주소 사용.

`NEXT_PUBLIC_API_URL`은 브라우저 코드에 포함되는 공개 값이므로 Vercel 변수 유형은 `Config`. 값에 `/v1`을 넣으면 `apiFetch`가 `/v1/v1/...`을 만들기 때문에 Railway origin까지만 입력.

환경변수 저장 후 새 배포 또는 `Redeploy` 필요.

회원가입 중 이메일·닉네임 확인이 실패하면 다음 순서로 확인:

```txt
1. Vercel Production 환경에 NEXT_PUBLIC_API_URL 존재
2. 값이 Railway API origin인지 확인
3. 새 배포 완료 여부 확인
4. Railway FRONTEND_URL=https://cinemo-six.vercel.app 확인
5. Railway API 직접 확인
```

```bash
curl --fail-with-body \
  'https://api-production-8ac7.up.railway.app/v1/auth/check-email?email=debug@example.com'
```

정상 응답:

```json
{"available":true}
```

Railway API가 `200`이고 `access-control-allow-origin: https://cinemo-six.vercel.app`을 반환하면 API·CORS 정상. 이때 Vercel 회원가입만 실패하면 최신 Web 배포가 이전 `localhost:3050` 값을 사용하는 상태.
