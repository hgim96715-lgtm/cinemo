# ARIA 접근성 메모

현재 적용 기준: 시맨틱 HTML 우선, 필요한 경우에만 ARIA 속성 추가.

## ARIA 개념

ARIA는 `Accessible Rich Internet Applications`의 약자. HTML 요소의 역할·상태·관계를 보조기술에 전달하는 속성 집합.

브라우저는 HTML과 ARIA 정보를 접근성 트리로 변환하고, 스크린 리더는 접근성 트리를 기준으로 요소를 해석.

| 개념 | 의미 |
|---|---|
| 시맨틱 HTML | `<button>`, `<a>`, `<nav>`처럼 본래 의미가 있는 HTML 요소 |
| `role` | 요소의 역할. 예: `dialog`, `tooltip`, `tab` |
| accessible name | 스크린 리더가 읽는 요소 이름 |
| accessible description | 요소 이름을 보충하는 설명 |
| 접근성 트리 | 보조기술에 전달되는 요소·역할·이름·상태 정보 |

> [!note]
> ARIA는 시각적 동작이나 키보드 동작을 자동으로 구현하지 않음. 의미 전달만 담당하므로 실제 동작과 포커스 처리가 별도 필요.

## 기본 원칙

- 기본 HTML 요소의 의미와 동작을 우선 사용
- `<div>`에 `role="button"`을 추가하기보다 `<button>` 사용
- 아이콘 버튼·링크에 accessible name 제공
- 장식용 아이콘은 접근성 트리에서 제외
- 현재 상태는 `aria-expanded`, `aria-selected`, `aria-pressed` 등으로 전달
- `aria-hidden="true"` 요소는 포커스 대상이나 상호작용 요소로 사용하지 않음
- 같은 요소에 부여한 역할과 숨김 상태의 의미 충돌 여부 점검

## 주요 속성

| 속성 | 역할 | 사용 기준 |
|---|---|---|
| `aria-label` | accessible name 직접 지정 | 화면에 이름 텍스트가 없는 아이콘 버튼·링크 |
| `aria-labelledby` | 다른 요소의 텍스트를 이름으로 연결 | 제목·레이블 요소가 이미 존재하는 경우 |
| `aria-describedby` | 추가 설명 연결 | 안내 문구·오류 문구·tooltip 연결 |
| `aria-hidden="true"` | 접근성 트리에서 제외 | 의미 없는 장식 아이콘 |
| `role="tooltip"` | 보조 설명 요소의 역할 지정 | 트리거와 연결된 비대화형 설명 |

## Tooltip 기준

- 트리거 요소에서 tooltip ID 연결
- tooltip에 `role="tooltip"` 지정
- hover뿐 아니라 keyboard focus에서도 표시
- tooltip 자체는 클릭·입력 대상이 아닌 설명 요소
- `role="tooltip"` 요소에 `aria-hidden="true"`를 함께 사용하지 않음

## 아이콘 버튼 규칙

- 아이콘 자체는 `aria-hidden="true"`로 처리
- 버튼·링크에는 의미 있는 `aria-label` 지정
- 포커스 가능한 요소에 `aria-hidden="true"` 적용 금지
- `title`과 커스텀 tooltip의 중복 사용 지양
- 영화별 tooltip ID는 `movie.id` 포함으로 중복 방지

## 점검 순서

1. 시맨틱 요소와 ARIA 역할의 필요성 확인
2. 아이콘 버튼·링크의 accessible name 확인
3. 키보드 Tab으로 포커스 가능 여부 확인
4. focus 상태에서 tooltip 표시 여부 확인
5. `aria-describedby` ID와 대상 요소 일치 여부 확인
6. `role`과 `aria-*` 속성의 의미 충돌 여부 확인
7. 브라우저 접근성 트리와 스크린 리더 결과 확인
