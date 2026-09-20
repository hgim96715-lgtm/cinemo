-- Add the source address labels without losing existing Region/District rows.
ALTER TABLE "regions"
ADD COLUMN "address_name" TEXT;

ALTER TABLE "districts"
ADD COLUMN "address_name" TEXT;

UPDATE "regions"
SET "address_name" = "name"
WHERE "address_name" IS NULL;

UPDATE "districts" AS district
SET "address_name" = region."address_name" || ' ' || district."name"
FROM "regions" AS region
WHERE district."region_id" = region."id"
  AND district."address_name" IS NULL;

ALTER TABLE "regions"
ALTER COLUMN "address_name" SET NOT NULL;

ALTER TABLE "districts"
ALTER COLUMN "address_name" SET NOT NULL;
