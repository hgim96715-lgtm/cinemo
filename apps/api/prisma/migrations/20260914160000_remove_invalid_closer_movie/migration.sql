DELETE FROM "movie_pool"
WHERE "title" = '클로저'
  AND "release_date" = '2026-09-15';

UPDATE "movie_pool"
SET "overview" = ''
WHERE "overview" ~* 'I don''t have access|Could you please provide|정보를 찾을 수 없|번역할 수 없';
