/*
  Warnings:

  - You are about to drop the column `avatarConfig` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "KobisMovieMatchSource" AS ENUM ('automatic', 'manual');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatarConfig";

-- CreateTable
CREATE TABLE "kobis_movie_mappings" (
    "id" UUID NOT NULL,
    "kobis_movie_cd" VARCHAR(20) NOT NULL,
    "title" TEXT NOT NULL,
    "release_date" TEXT,
    "tmdb_id" INTEGER,
    "match_source" "KobisMovieMatchSource",
    "tmdb_match_score" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "kobis_movie_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kobis_movie_mappings_kobis_movie_cd_key" ON "kobis_movie_mappings"("kobis_movie_cd");

-- CreateIndex
CREATE INDEX "kobis_movie_mappings_tmdb_id_idx" ON "kobis_movie_mappings"("tmdb_id");
