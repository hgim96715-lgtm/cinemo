-- CreateTable
CREATE TABLE "quote_posts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "quote_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_posts_tmdb_id_idx" ON "quote_posts"("tmdb_id");

-- CreateIndex
CREATE INDEX "quote_posts_created_at_idx" ON "quote_posts"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "quote_posts_user_id_tmdb_id_text_key" ON "quote_posts"("user_id", "tmdb_id", "text");

-- AddForeignKey
ALTER TABLE "quote_posts" ADD CONSTRAINT "quote_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
