-- CreateTable
CREATE TABLE "oauth_login_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_login_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_login_codes_code_hash_key" ON "oauth_login_codes"("code_hash");

-- CreateIndex
CREATE INDEX "oauth_login_codes_expires_at_idx" ON "oauth_login_codes"("expires_at");

-- CreateIndex
CREATE INDEX "oauth_login_codes_user_id_idx" ON "oauth_login_codes"("user_id");

-- AddForeignKey
ALTER TABLE "oauth_login_codes" ADD CONSTRAINT "oauth_login_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
