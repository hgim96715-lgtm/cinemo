ALTER TABLE "user_movies"
ADD COLUMN "cinema_id" UUID;

CREATE INDEX "user_movies_cinema_id_idx"
ON "user_movies"("cinema_id");

ALTER TABLE "user_movies"
ADD CONSTRAINT "user_movies_cinema_id_fkey"
FOREIGN KEY ("cinema_id")
REFERENCES "cinemas"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;