-- Drop the retired cafe feature and its admin statistics.

-- Drop cafe foreign keys before removing the tables.
ALTER TABLE "cafe_messages" DROP CONSTRAINT "cafe_messages_table_id_fkey";
ALTER TABLE "cafe_messages" DROP CONSTRAINT "cafe_messages_user_id_fkey";
ALTER TABLE "cafe_table_seats" DROP CONSTRAINT "cafe_table_seats_table_id_fkey";
ALTER TABLE "cafe_table_seats" DROP CONSTRAINT "cafe_table_seats_user_id_fkey";

DROP TABLE "cafe_messages";
DROP TABLE "cafe_table_seats";
DROP TABLE "cafe_table_sessions";
DROP TABLE "cafe_notices";

ALTER TABLE "admin_daily_stats" DROP COLUMN "cafe_messages";
ALTER TABLE "admin_hourly_stats" DROP COLUMN "cafe_messages";

DROP TYPE "CafeTableAccess";
