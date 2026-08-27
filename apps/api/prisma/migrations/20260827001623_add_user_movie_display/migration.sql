-- AlterTable
ALTER TABLE "user_movies" ADD COLUMN     "display_order" INTEGER,
ADD COLUMN     "is_displayed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wall_slot" INTEGER;
