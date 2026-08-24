/*
  Warnings:

  - You are about to drop the column `country_ids` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `genre_ids` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ott_ids` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "country_ids",
DROP COLUMN "genre_ids",
DROP COLUMN "ott_ids",
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
