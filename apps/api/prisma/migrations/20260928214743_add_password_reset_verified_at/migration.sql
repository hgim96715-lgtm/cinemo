-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "verified_at" TIMESTAMPTZ(3);
