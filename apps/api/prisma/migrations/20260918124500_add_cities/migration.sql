-- Add the optional City level without changing existing District rows.
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address_name" TEXT NOT NULL,
    "centerLatitude" DOUBLE PRECISION,
    "centerLongitude" DOUBLE PRECISION,
    "zoom" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "districts"
ADD COLUMN "city_id" UUID;

CREATE UNIQUE INDEX "cities_region_id_name_key"
ON "cities"("region_id", "name");

CREATE INDEX "cities_region_id_idx"
ON "cities"("region_id");

CREATE INDEX "districts_city_id_idx"
ON "districts"("city_id");

ALTER TABLE "cities"
ADD CONSTRAINT "cities_region_id_fkey"
FOREIGN KEY ("region_id") REFERENCES "regions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "districts"
ADD CONSTRAINT "districts_city_id_fkey"
FOREIGN KEY ("city_id") REFERENCES "cities"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
