-- Backfill search snapshots for quotes created before movie_title was added.
UPDATE "quote_posts" AS quote
SET "movie_title" = movie.title
FROM "movie_pool" AS movie
WHERE quote."movie_title" IS NULL
  AND quote."tmdb_id" = movie."tmdb_id"
  AND movie."title" IS NOT NULL
  AND btrim(movie."title") <> '';
