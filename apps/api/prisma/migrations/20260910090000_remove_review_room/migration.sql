-- Remove the retired public review room and its anonymous visit/stat columns.

ALTER TABLE "review_post_likes" DROP CONSTRAINT "review_post_likes_post_id_fkey";
ALTER TABLE "review_post_likes" DROP CONSTRAINT "review_post_likes_user_id_fkey";
ALTER TABLE "review_posts" DROP CONSTRAINT "review_posts_user_id_fkey";

DROP TABLE "review_post_likes";
DROP TABLE "review_posts";
DROP TABLE "anon_visits";

ALTER TABLE "admin_daily_stats" DROP COLUMN "reviews";
