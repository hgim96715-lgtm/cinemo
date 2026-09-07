-- AlterTable
ALTER TABLE "quote_posts" ADD COLUMN     "original_language" TEXT,
ADD COLUMN     "original_text" TEXT,
ALTER COLUMN "text" SET DATA TYPE TEXT;
