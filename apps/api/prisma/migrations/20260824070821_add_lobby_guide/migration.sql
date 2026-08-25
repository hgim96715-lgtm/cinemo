-- CreateTable
CREATE TABLE "lobby_guides" (
    "id" UUID NOT NULL,
    "key" VARCHAR(16) NOT NULL DEFAULT 'guide',
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lobby_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lobby_guides_key_key" ON "lobby_guides"("key");
