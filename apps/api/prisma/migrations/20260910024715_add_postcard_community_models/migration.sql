-- AlterTable
ALTER TABLE "postcard_comments" ADD COLUMN     "parent_id" UUID;

-- CreateTable
CREATE TABLE "postcard_comment_reactions" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emoji" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "postcard_comment_reactions_comment_id_emoji_idx" ON "postcard_comment_reactions"("comment_id", "emoji");

-- CreateIndex
CREATE INDEX "postcard_comment_reactions_user_id_created_at_idx" ON "postcard_comment_reactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "postcard_comment_reactions_comment_id_user_id_emoji_key" ON "postcard_comment_reactions"("comment_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "postcard_comments_parent_id_created_at_idx" ON "postcard_comments"("parent_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "postcard_comments" ADD CONSTRAINT "postcard_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "postcard_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comment_reactions" ADD CONSTRAINT "postcard_comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "postcard_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comment_reactions" ADD CONSTRAINT "postcard_comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
