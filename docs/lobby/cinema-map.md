# 영화관 찾기

`/cinema-map`에서 지역을 선택하면 CINEMO DB에 저장된 해당 지역의 영화관 목록과 좌표를 함께 조회하는 기능임.

## 현재 구현 상태

```txt
행정안전부 법정동코드 API
  → LegalDong 테이블에 전체 법정동 데이터 저장
  → 상위 행정구역만 골라 Region·District 생성

카카오 Local 장소 검색 API
  → 지역의 구·군 단위로 영화관 검색
  → 지역명 불일치 결과 제거
  → 카카오 장소 ID 기준 중복 제거
  → Cinema 테이블에 upsert

Web /cinema-map
  → Region 목록 조회
  → 선택한 Region의 Cinema 목록 조회
  → DB 좌표로 Leaflet Marker와 목록 표시
  → 카카오맵·네이버지도·Google Maps 길찾기 링크 제공
```

현재 화면은 구·군 선택까지 확정한 상태가 아니라 **광역 Region 단위 영화관 전체 조회**를 기준으로 동작함. `District` 데이터와 DB 관계는 유지하지만, 현재 Web 화면은 `Region`만 선택함.

### 전체 데이터 흐름

```mermaid
flowchart LR
    A[행정안전부 법정동코드 API]
    B[(LegalDong)]
    C[(Region · District)]
    D[카카오 Local API]
    E[(Cinema)]
    F[GET /regions]
    G[GET /cinemas?region=...]
    H[/cinema-map]
    I[Leaflet 지도와 영화관 목록]

    A -->|JSON 페이지 수집·upsert| B
    B -->|시도·시군구 계층 생성| C
    C -->|구·군 검색 기준| D
    D -->|영화관 결과 정규화·upsert| E
    E --> G
    C --> F
    F --> H
    G --> H
    H --> I
```

### 지금까지의 결정

| 항목 | 현재 결정 |
| --- | --- |
| 지역 기준 | `Region`의 광역자치단체 단위 |
| 지역 데이터 | 행정안전부 법정동코드 API를 원본으로 사용 |
| 영화관 검색 | 카카오 Local 키워드 검색 API 사용 |
| 영화관 저장 | 카카오 장소 ID(`kakaoId`)를 unique key로 사용 |
| 조회 화면 | 외부 API가 아니라 CINEMO DB 조회 |
| 지도 엔진 | Leaflet + React-Leaflet |
| 좌표 순서 | Leaflet 기준 `[위도, 경도]` |
| 지도 중심 | Region DB의 좌표·줌, 없으면 서울 기본값 |
| 외부 링크 | 카카오맵·네이버지도·Google Maps |
| Naver Place API | 제거. 현재 영화관 수집에는 사용하지 않음 |
| NCP Maps Geocoding | 제거. Region 좌표는 DB에 저장된 값 사용 |

## 구현 방향 검토

현재 적용 조합은 `Leaflet + React-Leaflet`이다. 영화관 API 연동은 완료했고, 행정구역 경계 레이어는 다음 단계로 둔다.

```txt
Leaflet             지도 엔진·터치 줌·팬
React-Leaflet       React 컴포넌트 연결
TopoJSON            향후 행정구역 경계 파일 용량 절감
topojson-client     향후 TopoJSON → GeoJSON 변환
카카오 Local·DB     영화관 지점·주소·좌표·브랜드 수집·저장
```

단, TopoJSON을 Leaflet에 직접 전달하지 않는다. `topojson-client`로 GeoJSON으로 변환한 뒤 React-Leaflet의 `GeoJSON` 레이어에 전달한다.

이 조합을 선택한 이유:

- 시·도와 구·군 폴리곤을 클릭하고 자동으로 확대하기 쉬움
- 영화관 위치를 Marker로 표시하기 쉬움
- 모바일 터치 줌·팬을 지원함
- 지도 스타일과 CINEMO 전용 선택 상태를 직접 제어할 수 있음
- 특정 지도 사업자에 화면 전체를 종속하지 않음

다른 조합을 선택할 조건은 [지도 라이브러리 선택 기준](../library/map-library.md)에 기록한다.

## 페이지 이름

- URL: `/cinema-map`
- 화면 제목: `지역별 영화관 탐색`
- 메뉴 이름: `CINEMA MAP`

URL과 컴포넌트 이름은 `cinema-map`으로 통일함. 사용자에게는 기술 용어보다 `지역별 영화관 탐색`이라는 제목으로 목적을 전달함.

## 화면 흐름

```txt
대한민국 지도
  → Region 선택
    → 해당 Region의 영화관 전체 조회
      → 영화관 목록·Marker·길찾기 링크 표시
```

지도 이동과 목록 조회는 같은 `selectedRegion` 상태를 공유한다. 현재 Region 선택은 페이지 내부 React state로 관리하며, 새로고침·공유 가능한 URL query 동기화는 아직 적용하지 않음.

## 화면 구성

```txt
영화관 찾기
├── 지역 선택 안내
├── 대한민국 지도
│   └── Region 선택
├── 선택한 지역
│   └── Region의 영화관 수
└── 영화관 목록
    ├── 영화관 브랜드
    ├── 지점명
    ├── 주소
    └── 지도·길찾기 링크
```

데스크톱에서는 지도와 목록을 함께 보여주고, 모바일에서는 다음 순서로 세로 배치한다.

```txt
지도
↓
선택한 지역
↓
Region 선택
↓
영화관 목록
```



## 지도 표시 방식

현재는 지역 경계를 렌더링하지 않고, 선택한 Region의 중심·줌·영화관 Marker만 변경한다. 행정구역 경계 데이터는 영화관 지점 데이터와 별개이므로 아직 지도에 직접 그리지 않는다.

```txt
현재: 지역 state → CinemaMapCanvas → 지도 중심·Marker
예정: TopoJSON → GeoJSON → React-Leaflet 경계 레이어
```

현재는 샘플 데이터를 사용하지 않고 `Cinema` DB에서 조회한 영화관을 Marker와 목록에 표시한다.

행정구역 경계와 영화관 지점은 같은 데이터로 취급하지 않는다.

```txt
행정구역 경계 → 정적 TopoJSON 자산
영화관 지점   → CINEMO API·DB의 좌표 데이터
```

구·군 선택과 행정구역 경계 표시가 필요해질 때 별도 기능으로 확장한다. 현재 기능의 핵심은 경계가 아니라 Region 단위 영화관 조회임.

### 지도 데이터에 포함할 값

```ts
type RegionFeature = {
  code: string;
  name: string;
  level: 'sido' | 'sigungu';
  geometry: unknown;
};
```

- `code`: 행정구역 내부 식별자
- `name`: 화면 표시명
- `level`: 시·도 또는 구·군
- `geometry`: GeoJSON geometry

`name`을 식별자로 사용하지 않는다. 지역명 변경·동명이인·띄어쓰기 차이로 데이터 연결이 깨질 수 있다.

## 영화관 데이터 가져오기

영화관 지점 데이터는 지도 경계 데이터와 별도로 관리한다.

```ts
type Cinema = {
  id: string;
  kakaoId: string;
  regionId: string;
  districtId: string | null;
  brand: string | null;
  name: string;
  category: string | null;
  address: string;
  roadAddress: string | null;
  placeUrl: string | null;
  latitude: number;
  longitude: number;
  syncedAt: string;
};
```

데이터 수집 기준:

- 공식 공개 데이터나 사용이 허용된 공공데이터를 우선 검토
- 크롤링이 필요한 경우 이용약관·robots 정책·갱신 안정성을 먼저 확인
- 외부 서비스의 HTML을 화면에서 직접 파싱하지 않음
- 수집한 지점은 내부 `cinemas` 데이터로 정규화하고 `regionCode`로 지역과 연결
- 주소·좌표·영업 여부의 갱신 시점을 기록
- 지도 화면에서 외부 영화관 사이트 HTML을 직접 읽거나 브라우저에서 장소 검색을 반복하지 않음
- 좌표가 없는 지점은 마커를 만들지 않고 주소·데이터 보완 상태를 목록에 표시할지 결정

지도 라이브러리와 영화관 데이터 출처는 분리한다. Leaflet을 사용하더라도 영화관 정보가 자동으로 생기는 것은 아니다.



## 현재 구현 파일

```txt
apps/web/app/cinema-map/page.tsx
apps/web/app/cinema-map/CinemaMapCanvas.tsx
apps/web/app/cinema-map/cinema-map-data.ts
apps/web/styles/cinema-map.css
apps/web/styles/cinemo-select.css
apps/web/styles/cinemo-page-header.css

apps/web/lib/region-api.ts
apps/web/lib/cinema-api.ts

apps/api/src/region/
apps/api/src/kakao/
apps/api/src/cinema/
apps/api/prisma/schema.prisma
```

`cinema-map-data.ts`에는 지도 화면에서 사용하는 `CinemaMapCinema` 타입과 예전 정적 샘플 데이터가 남아 있음. 현재 화면의 Region·Cinema 데이터는 API에서 가져오므로 정적 샘플 데이터는 실제 조회 원본이 아님.

```ts
type CinemaMapCinema = {
  id: string;
  name: string;
  address: string;
  brand: string;
  position: [number, number];
};
```

좌표는 `[위도, 경도]` 순서로 사용함. API 응답의 `latitude`, `longitude`를 Web 지도 모델의 `position`으로 변환함.

## API 흐름

### 공개 조회

```txt
GET /regions
  → Region·District 목록과 Region 중심 좌표 반환

GET /cinemas?region=서울특별시
  → 외부 API를 호출하지 않음
  → Cinema 테이블에서 해당 Region의 저장 영화관 조회
```

Web에서는 `getRegionsRequest()`와 `getCinemasRequest(region)`를 호출한다. 영화관 목록 조회는 카카오 API가 아니라 CINEMO DB를 기준으로 함.

### 관리자 동기화

```txt
POST /admin/regions/sync
  → 행정안전부 법정동코드 API 전체 페이지 수집
  → LegalDong upsert

POST /admin/regions/sync-regions-and-districts
  → LegalDong의 시·도 행을 Region으로 upsert
  → LegalDong의 시·군·구 행을 District로 upsert

POST /kakao/places/cinemas/sync?region=서울특별시
  → 해당 Region의 District 주소를 검색어로 사용
  → 카카오 영화관 결과 수집·지역 검증·중복 제거
  → Cinema upsert
```

## URL 상태

현재 지역 선택은 페이지 내부 React state로 관리한다.

```txt
selectedRegion
  → GET /cinemas?region={selectedRegion}
  → visibleCinemas 변환
  → 지도 Marker와 목록
```

URL query 동기화와 새로고침 후 선택 상태 복원은 다음 단계로 둔다.



## 데이터 모델 선택

영화관 지점은 외부 영화 API의 `tmdbId`와 같은 영화 식별자가 아니다. CINEMO가 지역별로 조회·갱신하는 장소 데이터임.

현재 `Cinema` 모델은 `Region`을 필수로 연결하고 `District`는 nullable로 둔다. 구·군 주소 해석이 완전히 확정되지 않은 상태에서 억지로 `districtId`를 연결하지 않기 위한 결정임.

```prisma
model Cinema {
  id          String   @id @default(uuid(7)) @db.Uuid
  kakaoId     String   @unique @map("kakao_id")
  regionId    String   @map("region_id") @db.Uuid
  districtId  String?  @map("district_id") @db.Uuid
  brand       String?
  name        String
  category    String?
  address     String
  roadAddress String?  @map("road_address")
  placeUrl    String?  @map("place_url")
  latitude    Float
  longitude   Float
  syncedAt    DateTime @default(now()) @map("synced_at") @db.Timestamptz(3)
}
```

지도 GeoJSON의 geometry를 Prisma에 저장할지는 별도로 판단한다.

- 자주 바뀌지 않는 경계 데이터: 정적 GeoJSON·TopoJSON 자산으로 관리
- 운영자가 수정하거나 버전별로 관리해야 하는 데이터: DB 저장 검토
- 영화관 지점: 카카오 장소 ID·브랜드·지역·주소·좌표를 DB에서 관리



## 상태 처리

- 지도 로딩: 지도 영역 loading 상태
- 지역 목록 로딩: 선택 영역 안의 목록 skeleton
- 영화관 조회 중: 기존 목록을 유지하고 새 지역 응답을 기다림
- 영화관 없음: `선택한 지역에 등록된 영화관이 없어요.`
- 데이터 오류: 지도와 목록 오류를 분리해 표시

## Leaflet 지도 이동·생명주기 오류

### 오류 1: `center is not defined`

```txt
ReferenceError: center is not defined
at MoveMap.useEffect (CinemaMapCanvas.tsx:69:5)
```

`center`, `zoom`, `cinemas`는 `MoveMap`의 props이다. `useEffect`가 `MoveMap` 함수 바깥에 있으면 이 값을 참조할 수 없다.

```tsx
function MoveMap({ center, zoom, cinemas, isLoading }: CinemaMapViewProps) {
  useEffect(() => {
    // center, zoom, cinemas 사용
  }, [center, cinemas, isLoading, zoom]);

  return null;
}
```

### 오류 2: 지도 이동 중 `_leaflet_pos` 오류

```txt
Uncaught TypeError: Cannot read properties of undefined (reading '_leaflet_pos')
at MoveMap.useEffect (CinemaMapCanvas.tsx:41:11)
at map.flyToBounds(...)
```

Leaflet의 지도 이동 메서드가 이미 제거된 지도 인스턴스의 `mapPane` 위치를 읽으려고 할 때 발생한다. React 개발 모드의 Strict Mode, Next.js Fast Refresh, 빠른 컴포넌트 재렌더링 과정에서 지도 인스턴스가 제거된 뒤 이전 effect가 실행되면 나타날 수 있다.

좌표가 잘못된 경우에는 보통 다음 오류가 발생하므로 구분해야 한다.

```txt
Bounds are not valid.
```

현재 오류는 좌표보다 지도 인스턴스의 생명주기 문제에 가깝다.

### 처리 원칙

1. `flyToBounds()`와 `flyTo()`를 호출하기 전에 `mapPane`이 존재하는지 확인한다.
2. 영화관 API를 요청하는 동안에는 지도 이동을 실행하지 않는다.
3. 새 응답이 도착한 뒤 한 번만 지도 이동을 실행한다.
4. 이전 지도 이동 애니메이션을 `map.stop()`으로 중지한다.
5. effect가 정리될 때 남아 있는 지도 이동을 중지한다.
6. `cinemas` 좌표에 `NaN`이나 무한대가 포함되지 않았는지 확인한다.

```tsx
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }

  if (isLoading || !map.getPane('mapPane')) {
    return;
  }

  map.stop();

  if (cinemas.length > 0) {
    const positions = cinemas
      .map((cinema) => cinema.position)
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

    if (positions.length > 0) {
      map.flyToBounds(L.latLngBounds(positions), {
        padding: [32, 32],
        maxZoom: 13,
        animate: true,
        duration: 0.8,
      });
    }
  } else {
    map.flyTo(center, zoom, { duration: 0.8 });
  }

  return () => {
    if (map.getPane('mapPane')) {
      map.stop();
    }
  };
}, [center, cinemas, isLoading, map, zoom]);
```

`mapPane`이 존재하지 않는 상태에서는 지도 이동 메서드를 호출하지 않는 것이 핵심이다.

### 지역 변경 시 이동 순서

지역을 바꾸면 API 응답을 기다리는 동안 기존 영화관 데이터를 바로 비우지 않는다. 기존 데이터를 비우면 지도 effect가 빈 배열을 보고 지역 중심으로 먼저 이동한 뒤, 새 응답을 받고 다시 영화관 범위로 이동하는 문제가 생긴다.

```txt
지역 선택
  → isCinemasLoading=true
  → 기존 Marker·목록 유지
  → 새 지역 영화관 응답 수신
  → isCinemasLoading=false
  → flyToBounds() 한 번 실행
```

영화관이 없는 지역은 새 응답이 빈 배열로 도착한 뒤 `flyTo(center, zoom)`으로 Region 중심을 표시한다. 영화관이 있는 경우에는 `flyToBounds()`와 `duration: 0.8`을 사용해 지역별 거리 차이로 이동 속도가 달라지는 현상을 줄인다.

지도 타일은 화면 중심이나 줌이 크게 바뀌면 새 타일을 요청한다. 이때 타일이 교체되는 과정에서 깜빡임처럼 보일 수 있으므로, 요청 중 중복 이동을 막고 지도 인스턴스를 재사용하지 않는 것이 중요하다.

## 모바일·데스크톱 레이아웃

```txt
데스크톱
┌──────────────┬────────────────┐
│ 지도          │ 선택 지역       │
│               │ 영화관 목록     │
└──────────────┴────────────────┘

모바일
┌────────────────┐
│ 지도             │
├────────────────┤
│ 선택 지역·변경   │
├────────────────┤
│ 영화관 목록      │
└────────────────┘
```

- 모바일에서는 지도와 목록을 좌우로 나누지 않음
- 지도 팝업만으로 지점 정보를 전달하지 않고 하단 목록을 함께 제공함
- 영화관 목록 클릭 시 해당 Marker로 지도 중심을 이동함
- 지역·구군 선택은 공통 `CinemoSelect`와 Radix Select를 사용함
- 지도 컴포넌트는 Next.js 서버 렌더링 대상에서 제외하고 클라이언트에서만 로드함
- 지도 컨테이너에는 명시적인 높이를 지정하고, 탭·모달 뒤에 표시될 때 크기 재계산을 처리함

## 구현 전 확인할 것

```txt
1. 행정구역 경계 데이터의 출처·라이선스
2. 영화관 주소·좌표 데이터의 출처·갱신 주기
3. 지도 타일 제공처·attribution·사용량 정책
4. 폐점·이전·브랜드 변경을 반영할 상태값
5. 모바일에서 지도 이동과 목록 스크롤이 충돌하지 않는지
```

지도는 영화관 목록을 대체하지 않는다. 지도에서 지역을 찾고, 목록에서 실제 지점 정보를 확인하는 구조로 유지한다.
