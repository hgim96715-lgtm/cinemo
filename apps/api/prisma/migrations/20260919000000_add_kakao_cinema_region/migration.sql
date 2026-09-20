-- Remove the temporary City hierarchy and align Cinema with Kakao place data.

-- Drop temporary City relations before removing the City hierarchy.
ALTER TABLE "cities"
DROP CONSTRAINT "cities_region_id_fkey";

ALTER TABLE "districts"
DROP CONSTRAINT "districts_city_id_fkey";

DROP INDEX "cinemas_name_road_address_key";

DROP INDEX "districts_city_id_idx";

ALTER TABLE "cinemas"
DROP COLUMN "official_url",
ADD COLUMN "kakao_id" TEXT NOT NULL,
ADD COLUMN "place_url" TEXT,
ADD COLUMN "region_id" UUID NOT NULL,
ALTER COLUMN "brand" DROP NOT NULL,
ALTER COLUMN "district_id" DROP NOT NULL;

ALTER TABLE "districts"
DROP COLUMN "city_id";

DROP TABLE "cities";

CREATE UNIQUE INDEX "cinemas_kakao_id_key"
ON "cinemas"("kakao_id");

CREATE INDEX "cinemas_region_id_idx"
ON "cinemas"("region_id");

CREATE INDEX "cinemas_brand_idx"
ON "cinemas"("brand");

ALTER TABLE "cinemas"
ADD CONSTRAINT "cinemas_region_id_fkey"
FOREIGN KEY ("region_id") REFERENCES "regions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
