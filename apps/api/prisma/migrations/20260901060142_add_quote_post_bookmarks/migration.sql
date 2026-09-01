-- CreateTable
CREATE TABLE "quote_post_bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quote_post_id" UUID NOT NULL,
    "create_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_post_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_post_bookmarks_user_id_create_at_idx" ON "quote_post_bookmarks"("user_id", "create_at" DESC);

-- CreateIndex
CREATE INDEX "quote_post_bookmarks_quote_post_id_idx" ON "quote_post_bookmarks"("quote_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_post_bookmarks_user_id_quote_post_id_key" ON "quote_post_bookmarks"("user_id", "quote_post_id");

-- AddForeignKey
ALTER TABLE "quote_post_bookmarks" ADD CONSTRAINT "quote_post_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_post_bookmarks" ADD CONSTRAINT "quote_post_bookmarks_quote_post_id_fkey" FOREIGN KEY ("quote_post_id") REFERENCES "quote_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
