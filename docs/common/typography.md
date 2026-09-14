# CINEMO Typography

CINEMO의 폰트는 모든 텍스트에 하나를 적용하지 않고, **UI 가독성·영화 문구의 감성·브랜드 로고의 식별성**을 분리해 관리함.

## 권장 조합

```txt
Pretendard        → 버튼·닉네임·날짜·일반 UI
DX영화자막2       → 엽서의 대표 문구·짧은 영화 대사
DX영화자막        → 긴 영화 문구·본문형 텍스트
Cormorant Garamond → CINEMO·POSTCARD·MOVIE CHART 영문 로고/라벨
```

## DX영화자막과 DX영화자막2

| 기준 | DX영화자막 | DX영화자막2 |
| --- | --- | --- |
| 인상 | 차분하고 자연스러운 자막 | 기울기와 손글씨 느낌이 강함 |
| 적합한 길이 | 긴 문장·본문 | 짧은 문장·강조 문구 |
| 제공 굵기 | Light·Medium·Bold·ExtraBold | Medium·Bold·ExtraBold |
| CINEMO 사용처 | 긴 엽서 문구·본문 | 대표 문구·감성적인 한 줄 |

DX영화자막2를 엽서의 대표 문구에 사용하면 영화 자막 같은 개성이 생김. 다만 모든 UI에 적용하면 장식성이 강해져 읽기 피곤할 수 있으므로 UI 기본 폰트로 사용하지 않음.

- [DX영화자막 공식 정보](https://www.sandollcloud.com/font/17049/DXMSubtitlesStd)
- [DX영화자막2 공식 정보](https://www.sandollcloud.com/font/17330/DXYeonghwaJamak2)

## 로고 폰트 결정

### Cormorant Garamond 권장

현재 CINEMO 로고처럼 영문 대문자 `CINEMO`를 사용하는 경우 Cormorant Garamond가 기본 선택임.

- 대문자 로고를 안정적으로 표현할 수 있음
- 영화 포스터와 극장 간판에 가까운 우아한 세리프 인상
- `font-weight: 600`과 넓은 `letter-spacing` 조합이 CINEMO의 금색 로고와 잘 맞음
- `CINEMO`, `POSTCARD`, `MOVIE CHART`처럼 여러 영문 라벨에 일관되게 적용 가능

```css
.cinemo-wordmark {
  font-family: var(--font-cormorant), serif;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

### Old Cave를 로고 기본값으로 선택하지 않는 이유

Old Cave는 짧은 영문 장식이나 개성 있는 타이틀에는 사용할 수 있지만, CINEMO 기본 로고로는 제약이 있음.

- 1001Fonts 기준 52자만 제공되어 문자 범위가 좁음
- 소문자 중심이라 대문자 `CINEMO` 로고의 일관성이 불확실함
- 원본이 OTF이며, 웹 자체 호스팅용 `.woff2`가 공식 제공되는 형태가 아님
- 로고 외의 라벨·페이지 제목까지 확장하기 어려움

따라서 Old Cave는 브랜드 로고가 아니라 이벤트성 영문 타이틀이나 포스터 장식에 한정하는 것이 안전함. [Old Cave 배포·라이선스 정보](https://www.1001fonts.com/old-cave-font.html)

## 라이선스와 웹폰트 적용

DX영화자막은 공식 안내에서 웹사이트 사용 가능으로 표시되지만, 페이지에 안내된 원본 포맷은 OTF/TTF임. `.woff2` 변환 및 `public/fonts` 자체 호스팅 전에 구매·사용권 범위와 파일 변환·배포 조건을 확인해야 함.

Pretendard와 Gowun Batang은 별도의 오픈 라이선스 조건을 확인한 뒤 로컬 파일로 추가함. 폰트 파일과 함께 라이선스 전문 또는 출처 문서를 보관함.

## 현재 적용 상태

- 현재 앱은 `apps/web/app/layout.tsx`에서 `next/font/google`을 사용 중
- 이 방식은 빌드 시 외부 폰트 리소스를 가져올 수 있음
- 로컬 웹폰트 전환은 라이선스가 확인된 `.woff2` 파일을 확보한 뒤 진행함
- 폰트 파일 확보 전에는 디자인 결정을 먼저 기록하고 코드 교체는 진행하지 않음
