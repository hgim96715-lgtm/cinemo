-- AlterTable
ALTER TABLE "districts" ALTER COLUMN "centerLatitude" DROP NOT NULL,
ALTER COLUMN "centerLongitude" DROP NOT NULL,
ALTER COLUMN "zoom" DROP NOT NULL;

-- AlterTable
ALTER TABLE "regions" ALTER COLUMN "centerLatitude" DROP NOT NULL,
ALTER COLUMN "centerLongitude" DROP NOT NULL,
ALTER COLUMN "zoom" DROP NOT NULL;
