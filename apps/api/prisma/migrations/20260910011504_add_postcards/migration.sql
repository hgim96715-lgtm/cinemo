-- CreateTable
CREATE TABLE "postercards" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "movie_title" TEXT,
    "text" TEXT NOT NULL,
    "poster_path" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "postercards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_bookmarks" (
    "id" UUID NOT NULL,
    "postcard_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_reactions" (
    "id" UUID NOT NULL,
    "postcard_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emoji" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "postercards_user_id_created_at_idx" ON "postercards"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "postercards_tmdb_id_idx" ON "postercards"("tmdb_id");

-- CreateIndex
CREATE INDEX "postercards_is_public_created_at_idx" ON "postercards"("is_public", "created_at" DESC);

-- CreateIndex
CREATE INDEX "postcard_bookmarks_user_id_created_at_idx" ON "postcard_bookmarks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "postcard_bookmarks_postcard_id_idx" ON "postcard_bookmarks"("postcard_id");

-- CreateIndex
CREATE UNIQUE INDEX "postcard_bookmarks_postcard_id_user_id_key" ON "postcard_bookmarks"("postcard_id", "user_id");

-- CreateIndex
CREATE INDEX "postcard_reactions_postcard_id_emoji_idx" ON "postcard_reactions"("postcard_id", "emoji");

-- CreateIndex
CREATE INDEX "postcard_reactions_emoji_postcard_id_idx" ON "postcard_reactions"("emoji", "postcard_id");

-- CreateIndex
CREATE INDEX "postcard_reactions_user_id_created_at_idx" ON "postcard_reactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "postcard_reactions_postcard_id_user_id_emoji_key" ON "postcard_reactions"("postcard_id", "user_id", "emoji");

-- AddForeignKey
ALTER TABLE "postercards" ADD CONSTRAINT "postercards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_bookmarks" ADD CONSTRAINT "postcard_bookmarks_postcard_id_fkey" FOREIGN KEY ("postcard_id") REFERENCES "postercards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_bookmarks" ADD CONSTRAINT "postcard_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_reactions" ADD CONSTRAINT "postcard_reactions_postcard_id_fkey" FOREIGN KEY ("postcard_id") REFERENCES "postercards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_reactions" ADD CONSTRAINT "postcard_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
