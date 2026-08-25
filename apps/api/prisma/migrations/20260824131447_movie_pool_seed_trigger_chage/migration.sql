/*
  Warnings:

  - The values [added] on the enum `MoviePoolSeedTrigger` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MoviePoolSeedTrigger_new" AS ENUM ('cron', 'manual');
ALTER TABLE "movie_pool_seed_runs" ALTER COLUMN "trigger" TYPE "MoviePoolSeedTrigger_new" USING ("trigger"::text::"MoviePoolSeedTrigger_new");
ALTER TYPE "MoviePoolSeedTrigger" RENAME TO "MoviePoolSeedTrigger_old";
ALTER TYPE "MoviePoolSeedTrigger_new" RENAME TO "MoviePoolSeedTrigger";
DROP TYPE "public"."MoviePoolSeedTrigger_old";
COMMIT;
