-- AlterTable
ALTER TABLE "quote_posts" ADD COLUMN "movie_title" TEXT;

-- Search index for movie title, quote text, and nickname is applied by the
-- application query plan; existing rows remain searchable by quote/user.
