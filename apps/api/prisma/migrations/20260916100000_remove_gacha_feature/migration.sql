DROP TABLE IF EXISTS "tickets";
DROP TYPE IF EXISTS "TicketStatus";

ALTER TABLE "admin_daily_stats"
  DROP COLUMN IF EXISTS "tickets_issued",
  DROP COLUMN IF EXISTS "tickets_used";

DROP TABLE IF EXISTS "movie_pool_seed_runs";
DROP TYPE IF EXISTS "MoviePoolSeedRunStatus";
DROP TYPE IF EXISTS "MoviePoolSeedTrigger";
