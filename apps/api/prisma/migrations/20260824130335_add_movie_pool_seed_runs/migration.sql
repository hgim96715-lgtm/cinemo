-- CreateEnum
CREATE TYPE "MoviePoolSeedRunStatus" AS ENUM ('running', 'succeeded', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "MoviePoolSeedTrigger" AS ENUM ('added', 'manual');

-- CreateTable
CREATE TABLE "movie_pool_seed_runs" (
    "id" UUID NOT NULL,
    "trigger" "MoviePoolSeedTrigger" NOT NULL,
    "status" "MoviePoolSeedRunStatus" NOT NULL DEFAULT 'running',
    "pages" INTEGER NOT NULL,
    "machine_count" INTEGER NOT NULL,
    "processed_pages" INTEGER NOT NULL DEFAULT 0,
    "fetched_count" INTEGER NOT NULL DEFAULT 0,
    "saved_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "movie_pool_seed_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_pool_seed_runs_started_at_idx" ON "movie_pool_seed_runs"("started_at");
