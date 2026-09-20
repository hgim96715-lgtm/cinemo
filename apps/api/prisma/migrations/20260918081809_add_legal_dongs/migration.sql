/*
  Warnings:

  - Added the required column `land_code` to the `legal_dongs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resident_code` to the `legal_dongs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sort_order` to the `legal_dongs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "legal_dongs" ADD COLUMN     "land_code" TEXT NOT NULL,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "resident_code" TEXT NOT NULL,
ADD COLUMN     "sort_order" INTEGER NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);
