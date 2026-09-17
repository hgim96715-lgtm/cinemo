ALTER TABLE "movie_pool"
  DROP COLUMN IF EXISTS "providers";

DROP TABLE IF EXISTS "movie_provider_overrides";
DROP TYPE IF EXISTS "MovieProviderOverrideAction";
