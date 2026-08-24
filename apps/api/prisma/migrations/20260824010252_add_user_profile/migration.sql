-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" VARCHAR(200),
ADD COLUMN     "country_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "genre_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ott_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "profile_public" BOOLEAN NOT NULL DEFAULT false;
