# MovieMediaOverride

> [!Info]
> 관리자 페이지를 다시 작성할 때 추가할 예정인 영화 미디어 보정 모델. 현재 기능은 아직 구현하지 않음.

## 목적

TMDB에 등록되지 않았거나 잘못 연결된 포스터·예고편·티저를 관리자가 직접 보정하기 위한 별도 override 모델.

TMDB 원본이나 `MoviePool` 값을 직접 덮어쓰지 않고, 관리자 보정 데이터를 별도로 저장함.

## 적용 우선순위

```txt
관리자 MovieMediaOverride
        ↓ 없거나 비활성
TMDB·MoviePool 기본 데이터
        ↓ 없음
null 또는 UI 기본 상태
```

- 관리자 override가 있으면 기본 TMDB 값보다 우선함
- override를 비활성화하거나 삭제하면 TMDB 기본값으로 되돌아감
- `tmdbId`를 영화 식별 기준으로 사용함
- 포스터와 영상은 서로 독립적으로 보정할 수 있어야 함

## 예정 필드

| 필드 | 타입 | 목적 |
|---|---|---|
| `tmdbId` | `Int` | TMDB 영화 식별자. unique 기준 |
| `posterPath` | `String?` | 관리자 지정 포스터 경로 또는 허용된 이미지 URL |
| `videoUrl` | `String?` | 관리자 지정 YouTube 영상 URL |
| `videoType` | `trailer \| teaser \| null` | 영상 종류 |
| `enabled` | `Boolean` | override 적용 여부 |
| `reason` | `String?` | 보정 사유와 출처 기록 |
| `updatedBy` | `String?` | 수정한 관리자 식별자 |
| `createdAt` | `DateTime` | 생성 시각 |
| `updatedAt` | `DateTime` | 수정 시각 |

## API·서비스 적용 위치

```txt
TmdbService
  → TMDB 상세 조회
  → MovieMediaOverride 조회
  → posterPath·videoUrl·videoType merge
  → Web 응답
```

- `MoviePool`에는 TMDB 원본 캐시를 유지함
- `TmdbService.getMovie()`가 기본값과 override를 합쳐 최종 응답을 반환함
- 영화차트와 `upcoming` 모두 같은 merge 규칙을 사용함
- 프론트는 override인지 기본값인지 알 필요 없이 최종 미디어만 표시함

## 관리자 기능

관리자 페이지 재작성 시 다음 기능을 추가할 예정.

- `tmdbId`로 영화 조회
- 현재 TMDB 포스터·영상 확인
- 포스터 경로 또는 허용된 이미지 URL 입력
- YouTube URL 입력 및 `trailer`·`teaser` 선택
- 저장 전 미리보기
- 적용·비활성화·기본값으로 되돌리기
- 수정 사유와 수정 관리자 표시

## 검증·보안 규칙

- 영상 URL은 `youtube.com`·`youtu.be` 등 허용된 YouTube 도메인만 허용
- 이미지 URL은 허용된 이미지 출처만 허용
- `javascript:`, `data:`, 임의 스크립트 URL 차단
- 관리자 권한과 서버 측 DTO 검증을 함께 적용
- 사용자가 입력한 값을 HTML에 직접 삽입하지 않음
- 삭제보다 `enabled = false`를 우선해 복구 가능하게 운영
- 변경 이력이 중요해지면 별도 audit log 추가

## 현재 상태

- 현재는 TMDB 영상 목록에서 공식 `Trailer`를 우선 선택하고, 없으면 `Teaser`를 선택함
- `videoType`으로 두 종류를 구분할 수 있음
- TMDB에 없는 영상이나 잘못 연결된 포스터를 관리자 화면에서 보정하는 기능은 아직 없음
- 관리자 페이지 재작성 시 `MovieProviderOverride`와 유사한 구조로 추가함

관련 문서: [MovieProviderOverride](./movie-provider-override.md), [TMDB 연동](../../external-api/tmdb.md)
