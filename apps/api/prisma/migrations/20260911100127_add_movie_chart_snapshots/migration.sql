-- CreateTable
CREATE TABLE "movie_chart_snapshots" (
    "id" UUID NOT NULL,
    "chart_date" DATE NOT NULL,
    "kobis_movie_cd" VARCHAR(20) NOT NULL,
    "tmdb_id" INTEGER,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "daily_audience_count" INTEGER NOT NULL,
    "audience_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_chart_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_chart_snapshots_chart_date_rank_idx" ON "movie_chart_snapshots"("chart_date", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "movie_chart_snapshots_chart_date_kobis_movie_cd_key" ON "movie_chart_snapshots"("chart_date", "kobis_movie_cd");
