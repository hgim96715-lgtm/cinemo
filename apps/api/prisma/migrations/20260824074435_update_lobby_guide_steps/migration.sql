/*
  Warnings:

  - You are about to drop the column `rules` on the `lobby_guides` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lobby_guides" DROP COLUMN "rules",
ADD COLUMN     "steps" JSONB NOT NULL DEFAULT '[]';
