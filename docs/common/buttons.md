# Common Buttons

경로: `apps/web/app/styles/common.css`

`.cinemo-button`은 내 엽서함의 수정·삭제·대표 엽서 고정·보관 취소처럼 여러 화면에서 반복되는 기본 버튼 형태를 제공함.

## 기준

- `inline-flex` 기반으로 글자와 아이콘을 중앙 정렬
- 최소 높이와 좌우 여백을 공통 적용
- 모서리는 알약형이 아닌 `0.35rem` 각도의 사각형에 가까운 형태
- 기본 배경은 투명하며 색상·테두리는 페이지별 의미에 따라 보완
- `:focus-visible`에 CINEMO 금색 외곽선 적용

## 사용 예시

```tsx
<button type="button" className="cinemo-button postcard-card-edit-button">
  수정
</button>
```

`.cinemo-button`은 공통 뼈대만 담당하고, 위험 동작의 빨간색이나 화면별 비활성 상태는 페이지 스타일에서 정의함.

## 적용 위치

- `apps/web/app/my-cinema/postcard/page.tsx`
- `apps/web/app/styles/my-postcard.css`
- `apps/web/app/styles/common.css`
