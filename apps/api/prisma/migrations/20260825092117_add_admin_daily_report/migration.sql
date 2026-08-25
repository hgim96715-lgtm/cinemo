-- CreateEnum
CREATE TYPE "AdminDailyReportStatus" AS ENUM ('running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "admin_daily_reports" (
    "id" UUID NOT NULL,
    "report_date" DATE NOT NULL,
    "status" "AdminDailyReportStatus" NOT NULL DEFAULT 'running',
    "filename" TEXT,
    "daily_row_count" INTEGER NOT NULL DEFAULT 0,
    "hourly_row_count" INTEGER NOT NULL DEFAULT 0,
    "visit_row_count" INTEGER NOT NULL DEFAULT 0,
    "login_row_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_daily_reports_report_date_key" ON "admin_daily_reports"("report_date");

-- CreateIndex
CREATE INDEX "admin_daily_reports_started_at_idx" ON "admin_daily_reports"("started_at" DESC);
