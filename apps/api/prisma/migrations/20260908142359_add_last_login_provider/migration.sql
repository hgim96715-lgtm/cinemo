-- CreateEnum
CREATE TYPE "LoginProvider" AS ENUM ('email', 'google', 'naver', 'kakao', 'apple');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLoginProvider" "LoginProvider";
