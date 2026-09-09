-- CreateTable
CREATE TABLE "movie_release_notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "release_date" DATE NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_release_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_release_notifications_enabled_release_date_sent_at_idx" ON "movie_release_notifications"("enabled", "release_date", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "movie_release_notifications_user_id_tmdb_id_key" ON "movie_release_notifications"("user_id", "tmdb_id");

-- AddForeignKey
ALTER TABLE "movie_release_notifications" ADD CONSTRAINT "movie_release_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
