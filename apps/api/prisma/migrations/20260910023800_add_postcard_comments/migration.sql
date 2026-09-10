-- CreateTable
CREATE TABLE "postcard_comments" (
    "id" UUID NOT NULL,
    "postcard_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "postcard_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "postcard_comments_postcard_id_created_at_idx" ON "postcard_comments"("postcard_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "postcard_comments_user_id_created_at_idx" ON "postcard_comments"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "postcard_comments" ADD CONSTRAINT "postcard_comments_postcard_id_fkey" FOREIGN KEY ("postcard_id") REFERENCES "postercards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comments" ADD CONSTRAINT "postcard_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
