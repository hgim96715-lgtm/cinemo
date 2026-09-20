/*
  Warnings:

  - You are about to drop the column `district` on the `cinemas` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `cinemas` table. All the data in the column will be lost.
  - You are about to drop the column `roadAddress` on the `cinemas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,road_address]` on the table `cinemas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `district_id` to the `cinemas` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX IF EXISTS "cinemas_name_roadAddress_key";

-- DropIndex
DROP INDEX IF EXISTS "cinemas_region_district_idx";

-- AlterTable
ALTER TABLE "cinemas" DROP COLUMN "district",
DROP COLUMN "region",
DROP COLUMN "roadAddress",
ADD COLUMN     "district_id" UUID NOT NULL,
ADD COLUMN     "road_address" TEXT;

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "centerLatitude" DOUBLE PRECISION NOT NULL,
    "centerLongitude" DOUBLE PRECISION NOT NULL,
    "zoom" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "centerLatitude" DOUBLE PRECISION NOT NULL,
    "centerLongitude" DOUBLE PRECISION NOT NULL,
    "zoom" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");

-- CreateIndex
CREATE INDEX "districts_region_id_idx" ON "districts"("region_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_region_id_name_key" ON "districts"("region_id", "name");

-- CreateIndex
CREATE INDEX "cinemas_district_id_idx" ON "cinemas"("district_id");

-- CreateIndex
CREATE UNIQUE INDEX "cinemas_name_road_address_key" ON "cinemas"("name", "road_address");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cinemas" ADD CONSTRAINT "cinemas_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
