-- Remove the retired quote-post domain before the postcard feature is rebuilt.

ALTER TABLE "quote_post_bookmarks" DROP CONSTRAINT "quote_post_bookmarks_quote_post_id_fkey";
ALTER TABLE "quote_post_bookmarks" DROP CONSTRAINT "quote_post_bookmarks_user_id_fkey";
ALTER TABLE "quote_posts" DROP CONSTRAINT "quote_posts_user_id_fkey";

DROP TABLE "quote_post_bookmarks";
DROP TABLE "quote_posts";
