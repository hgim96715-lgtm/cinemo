# TMDB

영화 포스터·메타 소스.  
뽑기 후보·메타는 **MoviePool**에 쟁여 두고, miss일 때 TMDB Discover / Details를 친다.

공식 문서: [https://developer.themoviedb.org/docs/getting-started](https://developer.themoviedb.org/docs/getting-started)  
API 레퍼런스: [https://developer.themoviedb.org/reference/intro/getting-started](https://developer.themoviedb.org/reference/intro/getting-started)

---

## KOBIS와 역할 분리

TMDB와 KOBIS는 같은 영화 데이터를 제공하는 것처럼 보여도 기준이 다름.

| 구분 | TMDB | KOBIS |
|--|--|--|
| 주된 역할 | 영화 메타데이터·포스터·상세 정보 | 국내 극장 박스오피스 순위 |
| 순위 기준 | 인기순·평점 등 TMDB 기준 | 국내 극장 관객·매출 기반 |
| 관객 수 | CINEMO의 박스오피스 기준으로 사용하지 않음 | audiAcc 누적 관객 수 사용 |
| 지역 | 전 세계 영화 데이터 | 국내 극장 상영 데이터 |
| CINEMO 사용처 | MoviePool·뽑기·영화 상세·포스터 | 로비 BOX OFFICE NOW |

로비 전광판은 KOBIS에서 순위·누적 관객 수를 받고, 영화 포스터는 TMDB와 MoviePool에서 보완함. 두 API를 하나의 출처처럼 섞지 않는 것이 중요함.

KOBIS 상세 구조 → [kobis.md](./kobis.md)

---

## 왜 서버만?

```txt
TMDB API Key / Read Access Token → apps/api 환경변수만
브라우저(Next)에서 직접 호출하지 않음
이유: 키 노출 · CORS · rate limit · 뽑기 로직이 서버에 있음
```

웹은 우리 API (`POST /tickets/use` · `GET /tickets/today` · user-movies 등)만 치고, 영화 결과는 Nest가 TMDB를 친 뒤 내려준다.

---

## 가입 · 키 발급

1. [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup)
2. Settings → API → Request an API Key (Developer)
3. 받는 것
  - **API Key** (v3) — 쿼리 `?api_key=`
  - **API Read Access Token** (v4) — 헤더 `Authorization: Bearer …` 권장

로컬:

```bash
# apps/api/.env
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_ACCESS_TOKEN=eyJ...   # Read Access Token (Bearer)
```

`.env`는 커밋하지 않음. API Key 방식은 쓰지 않고 Bearer만 사용.

---



## 호출 기본

Base URL: `https://api.themoviedb.org/3`

Bearer 방식 예:

```bash
curl -s "https://api.themoviedb.org/3/genre/movie/list?language=ko" \
  -H "Authorization: Bearer $TMDB_ACCESS_TOKEN" \
  -H "accept: application/json"
```

API Key 방식 예:

```bash
curl -s "https://api.themoviedb.org/3/genre/movie/list?language=ko&api_key=$TMDB_API_KEY"
```

응답은 JSON. Swagger처럼 우리 서버 `/api`가 아니라 **TMDB 사이트 레퍼런스**에서 스키마를 본다.

---



## 코드 (apps/api/src/tmdb)

```txt
discoverMovies(filters, page)          Discover
searchMovies(query, page)              Search · normalize + fallback
getMovie(movieId)                      detail+credits+videos+providers → MovieWithTags
getMovieProviders(movieId)           watch/providers KR · flatrate+rent+buy
getMovieCached(movieId, {force?})     풀 hit / miss → upsert · merge override · enrich 백그라운드
getMergeProviders(tmdbId, base)      MovieProviderOverride merge
fromPool(row)                          MoviePool → GachaMovie (+ merge) · enrich 백그라운드
enrichIfNeeded(tmdbId, …)              제목/줄거리/감독 한국어 보완 (활성 Provider)
resolveOverview(movieId, …)            짧은 줄거리만 영어 원문 기반으로 보완
seedPool(filters, pages)               Discover N페이지 → getMovieCached(force)
seedPoolAll(pages)                     전 머신 · progress 노출
pickRandomMovie(filters, excludeIds)
  - 풀: watched 제외 + genreIds / originCountries
  - 오류 문구가 제목인 오래된 MoviePool row는 제외
  - miss면 Discover 앞 20페이지 편향 랜덤 · 최대 8회
getMovieGenres(language='ko')          연동 확인
listProviderOverrides / upsertProviderOverride  admin
  seed-run.service.ts                    MoviePoolSeedRun 생성·진행·완료/실패 기록
  GitHub Actions                         KST 02:05 POST /v1/tmdb/seed-pool/cron?pages=3
```

AI:

```txt
apps/api/src/ai/
  ai.interface.ts   IAiProvider · AI_PROVIDER
  ai.service.ts     파사드
  claude.service.ts ClaudeService (claude-haiku-4-5)
  ai.module.ts      AI_PROVIDER → ClaudeService (교체 포인트)
  ai.controller.ts  빈 stub (공개 라우트 없음)
env  CLAUDE_KEY (.env.example)
```

AI Provider 구조·Claude/GPT 교체 규칙 → [ai.md](./ai.md)

컨트롤러:

```txt
GET  /tmdb/genres · /discover · /search
POST /tmdb/seed-pool · /seed-pool/all        @Roles(admin)
GET  /tmdb/seed-pool/progress                @Roles(admin)
POST /tmdb/seed-pool/cron                    @Public + x-cron-secret
GET  /tmdb/provider-overrides?tmdbId=        @Roles(admin)
POST /tmdb/provider-overrides                @Roles(admin)
```

---

## 잘못 저장된 MoviePool 제목

이전 실행에서 TMDB 조회 실패 문구가 `movie_pool.title`에 저장되면 후기방에 다음처럼 표시될 수 있다.

```txt
이 영화에 대한 정보를 찾을 수 없습니다.
```

현재 `getMovieCached()`는 다음 순서로 방어한다.

```txt
1. 캐시 title이 비어 있거나 오류 문구인지 확인
2. 오류 캐시는 그대로 반환하지 않고 TMDB Details 재조회
3. 재조회 결과가 다시 오류 문구면 MoviePool에 저장하지 않음
4. pickRandomMovie에서도 오류 제목 row를 후보에서 제외
```

로컬 DB에 오래된 오류 row가 남아 있어도 해당 영화가 다시 요청되는 시점에 정상 메타데이터로 갱신된다. TMDB 토큰·네트워크가 없으면 재조회가 실패할 수 있으므로 `TMDB_ACCESS_TOKEN`과 API 로그를 함께 확인한다.



## 뽑기에 쓸 엔드포인트



### 1) 장르 목록 (참고용)

`GET /3/genre/movie/list`

```txt
우리 머신 id ≠ TMDB genre id
예: thriller → 53, comedy → 35, sf → 878 · 전체 매핑은 GACHA_TMDB_FILTERS
```

전체 장르를 UI 머신으로 쓰지 않는다. 우리가 고른 소수만 노출.

`language` 쿼리 (예: `ko`, `en`)는 **장르 이름 번역**만 바꾼다.

```txt
language=ko  → 액션, 스릴러 …
language=en  → Action, Thriller …
한국 영화만 고르는 필터가 아님
국적 필터는 Discover의 with_origin_country=KR
```

코드에서 `getMovieGenres(language = 'ko')` 기본값도 같은 의미 (이름만 한국어).

### 2) 영화 검색(필터) — 핵심

`GET /3/discover/movie`


| 쿼리                    | 용도                                  | 예                              |
| --------------------- | ----------------------------------- | ------------------------------ |
| `with_genres`         | 장르                                  | `53` (Thriller), `28` (Action) |
| `with_origin_country` | 제작/원산 국가                            | `KR`, `JP`, `US`               |
| `language`            | 제목·overview 등 **텍스트 언어** (국적 필터 아님) | `ko-KR`                        |
| `sort_by`             | 정렬                                  | `popularity.desc`              |
| `page`                | 페이지                                 | `1` ~ …                        |
| `include_adult`       | 성인                                  | `false`                        |


장르방 예:

```txt
/3/discover/movie?with_genres=53&language=ko-KR&include_adult=false&sort_by=popularity.desc&page=1
```

국적방 예:

```txt
/3/discover/movie?with_origin_country=KR&language=ko-KR&include_adult=false&sort_by=popularity.desc&page=1
```

#### 국가 코드 `iso_3166_1` (Discover 문서엔 안 나옴)

`KR` / `JP` / `US` 는 **ISO 3166-1** 국가 코드 (두 글자).

Discover 페이지에 `iso_3166_1` 필드가 없는 게 정상 — 엔드포인트마다 이름이 다름.

| 어디 | 필드 | 역할 |
|--|--|--|
| [Discover](https://developer.themoviedb.org/reference/discover-movie) | 쿼리 `with_origin_country=KR` | **필터** (요청) |
| [Movie Details](https://developer.themoviedb.org/reference/movie-details) | `production_countries[].iso_3166_1` | **응답** 국가 코드 |
| Movie Details (최근) | `origin_country: ["US"]` | 문자열 배열로도 올 수 있음 |

```txt
뽑기 필터:  Discover ?with_origin_country=KR
태그 저장:  Movie Details → production_countries[].iso_3166_1
            → MoviePool.originCountries ["KR", ...]

같은 "KR"인데
  Discover = 고를 때 쓰는 쿼리 이름
  Details  = 저장할 때 읽는 객체 키 이름 (iso_3166_1)
```

랜덤 머신: 필터 없이 popularity 페이지에서 뽑거나, page를 랜덤으로.

응답 `results[]` 한 건 대략:

```txt
id, title, original_title, overview,
poster_path, backdrop_path,
genre_ids, release_date, vote_average, ...
```

### 개봉 예정 영화 조회

로비의 `UPCOMING INTEREST`와 `/upcoming` 페이지는 같은 조회 규칙을 사용함.

```txt
GET /discover/movie
  region=KR
  release_date.gte=오늘(KST)
  release_date.lte=오늘부터 1년
  with_release_type=2|3
  language=ko-KR
  page=1~3
```

조회 결과는 다음 조건을 모두 만족해야 목록에 포함함.

- 개봉일이 오늘부터 1년 이내임
- 제목에 한글이 포함됨
- 제목이 비어 있지 않고 `정보가 없습니다.` 문구가 아님
- `poster_path`가 존재함

TMDB Discover 결과만 사용하면 첫 페이지 밖의 영화나 이미 `MoviePool`에 저장된 예정작이 빠질 수 있음. 따라서 같은 기간의 `MoviePool` 영화도 합치고 `tmdbId`로 중복 제거함. `MoviePool` 데이터에도 제목·포스터 필터를 동일하게 적용함.

최종 목록의 `interestCount`는 `UserMovie`에서 `kind=wish`인 행을 `tmdbId`별로 집계한 값임. 로비는 이 값을 기준으로 정렬해 상위 5개를 표시하고, `/upcoming`은 전체 목록과 영화별 관심 수를 표시함.



### 3) 영화 검색(키워드) — 후기방

`GET /3/search/movie`

| 쿼리 | 용도 |
|--|--|
| `query` | 검색어 (서버에서 `normalizeSearchQuery`) |
| `language` | `ko-KR` |
| `include_adult` | `false` |
| `page` | 페이지 |

우리 API: `GET /tmdb/search?q=&page=` (@Public) → `searchMovies`.

```txt
결과 0건 · 공백 없는 3글자+ → searchQueryFallbacks
  · 1음절 뒤 공백 (싱스트리트 → 싱 스트리트)
  · 2음절 뒤 공백 (4글자 이상일 때)
```

후기 create는 watched/티켓 제한 없음 · `tmdbId`는 `getMovieCached`로 존재 확인.  
→ [review.md](./review.md)

### 4) 단건 상세

`GET /3/movie/{movie_id}?language=ko-KR&append_to_response=credits`

```txt
getMovie / pickRandomMovie 공통
감독 = credits.crew 중 job === Director
앱 카드 필드: id title overview poster_path release_date director providers
풀 태그: genres[].id · production_countries[].iso_3166_1
          → MoviePool.genreIds / originCountries
providers: getMovieProviders → MoviePool.providers JSON
           응답 시 getMergeProviders (admin override)
```

호출처:

```txt
tickets/use          → pickRandomMovie
tickets/today        → used면 getMovieCached(tmdbId) 복원
user-movies listByKind → row마다 getMovieCached
```

---



## 이미지 URL

TMDB는 경로만 준다. 앞에 이미지 호스트를 붙인다.

```txt
poster_path 예: /abc123.jpg
전체 URL: https://image.tmdb.org/t/p/w500/abc123.jpg
```

자주 쓰는 size: `w185` · `w342` · `w500` · `original`  
설정 목록: `GET /3/configuration`

웹: `apps/web/lib/tmdb-image.ts`

---



## CINEMO 매핑

```txt
packages/shared GACHA_MACHINES     → UI 방/머신
packages/shared GACHA_TMDB_FILTERS → Discover 쿼리 · 풀 태그 필터와 같은 값
apps/api/tmdb + ticket/use         → pickRandomMovie (풀 우선 · miss면 Discover)
apps/api/tmdb/search + review-post → 후기 쓰기 TMDB 검색
apps/web /gacha                    → 캡슐 · 플립 카드 · wish/watched marks
apps/web /review                   → searchMoviesRequest · normalizeSearchQuery
```

흐름:

```txt
유저 머신 선택 (thriller)
  → POST /tickets/use { machineId }
  → watched tmdbId exclude
  → pickRandomMovie
       풀: genreIds has 53 → fromPool
       miss → Discover → getMovieCached
  → Ticket에 machineId + tmdbId 저장
  → 응답 { status, machineId, movie }
  → 웹 플립 카드 + marks
```

쪽지(노트)는 TMDB에 없음. 우리 DB/카탈로그에서 붙인다. 전체 UI → [gacha.md](./gacha.md)

### 랜덤 방식 · MoviePool

**풀(pool)** = 우리 DB `movie_pool`에 모아 둔 **영화 후보·메타 상자**.  
수영장 pool이 아니라 “후보자 모음 / 재고”.

#### `TmdbService` 메서드 역할 (헷갈리면 여기)


| 메서드               | 한 줄                                                              | 누가 부르나                                        |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| `fromPool`        | DB 행 → 카드 · mergeProviders · enrich 백그라운드 | hit · pick 풀 |
| `getMovieCached`  | 풀 hit → fromPool · miss → TMDB upsert · enrich | 선반 · today · seed · picks |
| `enrichIfNeeded`  | 제목/줄거리/감독 한국어 (Claude) · MoviePool 갱신 | fromPool · getMovieCached |
| `getMovieProviders` | TMDB watch/providers KR · dedup · collapse      | `getMovie` · seed upsert |
| `getMergeProviders` | TMDB base + MovieProviderOverride              | fromPool · getMovieCached 응답 |
| `seedPool`        | Discover N페이지 · `getMovieCached(force)` · onPageDone | admin POST · cron |
| `seedPoolAll`     | 전 GACHA_MACHINES · seedProgress               | cron 02:00 · admin |
| `pickRandomMovie` | 풀 랜덤 · miss Discover                        | tickets/use (picks 제외) |

**`fromPool`이 왜 있나**

```txt
DB  MoviePool:  tmdbId, posterPath, releaseDate   (Prisma camelCase)
API 카드:       id,     poster_path, release_date (TMDB·프론트와 동일)

모양이 달라서 변환이 필요함.
없어도 동작함 — getMovieCached / pickRandomMovie에 같은 매핑을
두 번 안 쓰려고 한곳에 모은 것.
```

```txt
fromPool        = 모양만 바꿈 (mapper)
getMovieCached  = 한 편 가져오기 + 없으면 상자에 넣기 (read-through cache)
                  태그(genreIds/originCountries) 비어 있으면 재동기화
seedPool        = 여러 편 미리 상자에 쟁이기 (bulk fill)
pickRandomMovie = 뽑을 한 편 고르기 (pick)  ← 풀 태그 필터 후 fromPool / Discover
```

#### hit / miss 가 뭐냐

캐시 용어. `getMovieCached` 기준:

```txt
hit  = 풀에 그 tmdbId가 이미 있음 → DB만 읽고 끝 (TMDB 안 침)
miss = 풀에 없음 → TMDB 가서 가져온 뒤 상자에 upsert
```

태그 컬럼 추가 **전에** 시드해 둔 row:

```txt
풀에 row는 있음 → 예전엔 무조건 hit
genreIds / originCountries 는 [] (빈 배열)
hit면 upsert를 안 타서 태그가 영원히 안 채워짐
→ 장르/국적 머신 풀 필터도 못 걸림
```

그래서 지금 hit 조건:

```txt
row 있음 + 태그가 하나라도 있음 → hit (DB만)
row 없음 또는 태그 둘 다 빔 → miss처럼 TMDB → upsert로 태그 채움
```

“hit인가?” = “상자에서 바로 써도 되는 **완전한** 캐시인가?”

#### 흐름

```txt
[선반 · 오늘 복원]
  getMovieCached(tmdbId)
    → hit(태그 있음)  fromPool(row)     ← TMDB 0회
    → miss·태그 없음  getMovie → upsert ← TMDB 1회 후 상자·태그 채움

[시드]
  POST /tmdb/seed-pool?machineId=&pages=     @Roles(admin)
  POST /tmdb/seed-pool/all?pages=            @Roles(admin) · GET seed-pool/progress
  GitHub Actions KST 02:05 · POST /tmdb/seed-pool/cron?pages=3
    → Railway API → seedPoolAll → getMovieCached(force) × N · 페이지 간 300ms

[뽑기 useToday]
  machineId=picks → ticket.pickFromReviews (ReviewPost DISTINCT) → getMovieCached
  그외 → pickRandomMovie(filters, watchedIds)
    → 풀: watched 제외 + genreIds / originCountries 태그
    → hit → fromPool (TMDB 안 침)
    → miss · 태그 없는 옛 row → Discover → getMovieCached
```

한 줄:

```txt
풀 = DB 영화 상자 (+ genreIds · originCountries 태그)
캐시 읽기 = getMovieCached
미리 채우기 = seedPool
뽑기 = pickRandomMovie (태그 필터) · picks = ReviewPost DISTINCT
카드 변환 = fromPool
한국어 보완 = enrichIfNeeded (Claude · 백그라운드)
```

스키마 → [prisma/current-model.md MoviePool](../prisma/current-model.md)

---

## 한국어 enrich (Claude)

TMDB `ko-KR`이 비거나 제목·감독이 한글/ASCII가 아닐 때. **ko_ 컬럼 없음** — `MoviePool` 필드에 직접 반영.

```txt
조건
  overview.trim() === ''
  title에 한글 없고 ASCII 밖 문자 있음 (일·중 원제 등)
  director 동일

흐름
  1. TMDB en-US detail
  2. AiService
       translateOverview(titleEn, overviewEn)
       koreanTitle(titleEn, year)
       koreanDirector(name) → 저장 형태 `원문 (한글)`
  3. 바뀐 값만 MoviePool.update
  4. fromPool / getMovieCached는 void로 백그라운드 호출 (응답 지연 ❌)

웹 (뽑기)
  use 응답 overview 비면 ~2.5s 후 GET /tickets/today → 카드 줄거리 갱신

실패  null · warn → 기존 문자열 유지
env   CLAUDE_KEY
모델  claude-haiku-4-5
교체  apps/api/src/ai/ai.module.ts 의 AI_PROVIDER
코드  apps/api/src/ai/ (AiController stub · HTTP 노출 ❌)
UI   [gacha.md](./gacha.md) 카드 제목·줄거리·감독
```

#### 빈 메타 (시드해 보면 나옴)

TMDB가 필드를 안 주는 경우가 있음. 우리 버그라기보다 **원본 구멍**.

```txt
overview           ko-KR 번역 없으면 ""
release_date       미개봉·미정이면 ""
director           credits에 Director 없으면 null
genre_ids          genres 비면 []  → MoviePool.genreIds []
origin_countries   production_countries 비면 []
                   → MoviePool.originCountries []
```

시드는 Discover id를 그대로 넣으니 빈 메타·빈 태그도 `movie_pool`에 들어감.

**빈 태그일 때 동작**

```txt
getMovieCached hit 조건 = 태그 하나라도 있음
genreIds·originCountries 둘 다 [] 이면
  → 매번 miss처럼 TMDB 재호출 후 upsert
  → TMDB도 계속 빈 배열이면 매 요청마다 TMDB 침 (드묾)

장르/국적 풀 필터
  genreIds has 53 / originCountries has KR
  → 태그 빈 row는 후보에 안 걸림
  → 그 머신은 풀 miss → Discover로 넘어감
```

**나중 생각해볼 것** (지금은 그대로 둬도 됨):

```txt
시드/캐시
  title + poster_path 없으면 upsert skip (카드 안 나옴)
  overview / director / release_date 빈값 → 허용 (흔함)
  태그 둘 다 빈 row → 시드 skip? 또는 “태그 없음” 플래그로 재동기화 중단

선택
  ko overview 비면 en-US fallback (요청 2배 · 시드에만?)

UI
  줄거리 없음 · 감독 미상 · 연도 칸 숨김

뽑기
  posterPath NOT NULL 만 후보 (풀·Discover 모두)
  overview 없어도 뽑기는 가능 · 카드에 안내 문구
```

정리: **포스터·제목 필수 필터**, 나머지 빈칸·빈 태그는 **원본/UI·Discover fallback**으로 흡수.

### 찜 · 본 작품

```txt
카드 marks UI + UserMovie API → [my-cinema.md](./my-cinema.md)
가챠 pick 시 watched 제외 (서버)
선반·뽑기 메타 → MoviePool (태그 포함)
```

---



## 직접 읽어볼 순서

1. Getting Started (키 · Bearer)
2. [Discover Movie](https://developer.themoviedb.org/reference/discover-movie) — 쿼리 파라미터
3. [Genre Movie List](https://developer.themoviedb.org/reference/genre-movie-list) — id 확인
4. [Movie Details](https://developer.themoviedb.org/reference/movie-details) — credits append
5. Images / Configuration — 포스터 URL
6. (선택) Rate limiting 안내

로컬에서 `curl`로 genre list → discover 한 번 찍어보면 감 잡힘.

---



## 주의

```txt
키/토큰 커밋 금지
성인 콘텐츠 include_adult=false 기본
Discover는 “정확 매칭”이 아니라 필터·인기 순 풀
같은 날 같은 머신도 결과가 달라질 수 있음 (풀 skip 랜덤 · Discover 랜덤)
listByKind는 getMovieCached — 풀 hit면 TMDB 안 침
옛 row 태그 비면 getMovieCached가 재동기화
TMDB ToS · attribution 요구 있으면 UI에 표기
```

---



## 나중에: 연령 / 19금

아이디어: **성인 인증 + 만 19세 이상**인 유저만 19금 콘텐츠를 보고, 아니면 카탈로그·추천·뽑기·후기방에서 뺀다.  
나이는 **만 나이 · KST** 기준으로 문서화.

```txt
User
  birthDate          # 생년월일
  adultVerifiedAt    # 성인 인증 동의 시각 (null = 미인증)

서버 헬퍼 (뽑기·후기·추천 공통)
  isAdultViewer =
    adultVerifiedAt != null
    && ageKst(birthDate) >= 19
```

```txt
기본 (!isAdultViewer)
  - include_adult=false 고정
  - 19금 방/머신 UI 숨김
  - 전광판·추천·랜덤 풀에서 성인작 제외
  - 후기방: contentRating=adult 게시·포스터 응답에서 제외

성인 뷰어 (isAdultViewer)
  - 프로필/설정에서 생년월일 + 동의 → adultVerifiedAt 저장
  - GACHA_ROOMS에 age 방 또는 19금 머신 노출
  - 그때만 include_adult 또는 certification 필터 허용
  - 후기방: adult 콘텐츠 포함 (필터 옵션은 선택)

어린이/패밀리
  - Family(10751) 등 별도 머신
  - 성인·과도한 폭력 제외는 certification / without_genres로
```

후기방 예:

```txt
Review / Poster wall
  contentRating: 'all' | 'adult'

GET /review-posts
  if (!isAdultViewer) → where contentRating != 'adult'
  if (isAdultViewer)  → 전체 (또는 쿼리로 필터)

UI만 숨기면 부족 — 목록 API에서 걸러야 함
뽑기방 19금과 동일 isAdultViewer 재사용
```

원칙:

```txt
서버가 최종 게이트 (클라이언트가 include_adult 켜도 무시)
미인증·19세 미만 = 추천·뽑기·후기 목록 모두 비성인
인증 여부는 User 프로필에 보관
MVP에는 넣지 않음 — 장르/국적 뽑기 안정화 후
```

관련: [ticket.md](./ticket.md) · [gacha.md](./gacha.md) · [my-cinema.md](./my-cinema.md)

---

## UPCOMING 상세 데이터

개봉 예정 영화 목록·기간 필터·관심 순위·상세 모달은 [upcoming.md](./upcoming.md)에 정리함.

`GET /v1/tmdb/movie/:movieId`는 `append_to_response=credits,videos`로 다음 정보를 조합함.

```txt
TMDB Details
  ├─ genres                  → 장르 태그
  ├─ credits.crew Director   → 감독
  ├─ credits.cast            → 주요 배우 최대 5명
  ├─ videos.results          → 공식 YouTube Trailer
  ├─ production_countries   → origin_countries
  └─ watch/providers KR      → 국내 시청 가능 Provider
```

한국어 줄거리가 비어 있거나 80자 미만·한 문장인 경우에는 `en-US` 원문을 가져와 활성 AI Provider로 번역함. 결과는 MoviePool에 저장해 같은 영화의 보정 요청을 줄임. 원문과 AI 모두 실패하면 근거 없는 내용을 만들지 않고 원문 또는 빈 상태를 유지함.
