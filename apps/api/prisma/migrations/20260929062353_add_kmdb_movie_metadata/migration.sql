/*
  Warnings:

  - A unique constraint covering the columns `[kmdb_doc_id]` on the table `movie_pool` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "movie_pool" ADD COLUMN     "kmdb_doc_id" TEXT,
ADD COLUMN     "kmdb_poster_url" TEXT,
ADD COLUMN     "kmdb_release_date" TEXT,
ADD COLUMN     "kmdb_vod_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "movie_pool_kmdb_doc_id_key" ON "movie_pool"("kmdb_doc_id");
