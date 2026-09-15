-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "pricingHeadingAr" TEXT,
ADD COLUMN     "pricingHeadingEn" TEXT;

-- CreateTable
CREATE TABLE "EventDownload" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventDownload_eventId_idx" ON "EventDownload"("eventId");

-- AddForeignKey
ALTER TABLE "EventDownload" ADD CONSTRAINT "EventDownload_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
