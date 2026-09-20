-- CreateTable
CREATE TABLE "legal_dongs" (
    "id" UUID NOT NULL,
    "region_code" TEXT NOT NULL,
    "sido_code" TEXT NOT NULL,
    "sigungu_code" TEXT NOT NULL,
    "eupmyeondong_code" TEXT NOT NULL,
    "ri_code" TEXT NOT NULL,
    "address_name" TEXT NOT NULL,
    "lowest_name" TEXT NOT NULL,
    "upper_code" TEXT NOT NULL,
    "effective_date" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_dongs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_dongs_region_code_key" ON "legal_dongs"("region_code");

-- CreateIndex
CREATE INDEX "legal_dongs_sido_code_sigungu_code_idx" ON "legal_dongs"("sido_code", "sigungu_code");
