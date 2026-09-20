-- CreateTable
CREATE TABLE "cinemas" (
    "id" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "address" TEXT NOT NULL,
    "roadAddress" TEXT,
    "official_url" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "synced_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cinemas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cinemas_region_district_idx" ON "cinemas"("region", "district");

-- CreateIndex
CREATE UNIQUE INDEX "cinemas_name_roadAddress_key" ON "cinemas"("name", "roadAddress");
