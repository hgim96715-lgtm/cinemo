# CINEMO Design Tokens

경로: `apps/web/app/styles/common.css`

화면마다 색상 값을 반복하지 않도록 CINEMO의 기본 전경색·보조색·금색·잉크색을 전역 변수로 관리함.

## 색상 토큰

| 토큰 | 기본값 | 용도 |
| --- | --- | --- |
| `--cinemo-fg` | `#f3efe6` | 기본 글자·밝은 전경색 |
| `--cinemo-muted` | `#958d82` | 날짜·설명·보조 텍스트 |
| `--cinemo-gold` | `#d4b56a` | 강조색·주요 액션 |
| `--cinemo-ink` | `#17171a` | 금색 주요 버튼 위의 글자색 |

## 사용 기준

- 페이지 전용 스타일은 공통 토큰을 재사용함
- 화면마다 새로운 금색·텍스트 색상 값을 만들지 않음
- 공통 토큰의 의미를 바꾸지 않고 컴포넌트별 상태는 별도 클래스에서 보완함

```css
.feature-title {
  color: var(--cinemo-gold);
}

.feature-description {
  color: var(--cinemo-muted);
}
```
