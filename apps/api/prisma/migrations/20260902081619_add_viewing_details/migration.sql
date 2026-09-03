-- CreateEnum
CREATE TYPE "UserMovieViewingType" AS ENUM ('theater', 'home', 'other');

-- AlterTable
ALTER TABLE "user_movies" ADD COLUMN     "viewing_location" VARCHAR(100),
ADD COLUMN     "viewing_platform" VARCHAR(40),
ADD COLUMN     "viewing_type" "UserMovieViewingType";
