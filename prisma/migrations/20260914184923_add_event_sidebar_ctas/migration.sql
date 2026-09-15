-- CreateTable
CREATE TABLE "EventSidebarCta" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "style" TEXT NOT NULL DEFAULT 'secondary',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSidebarCta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSidebarCta_eventId_idx" ON "EventSidebarCta"("eventId");

-- AddForeignKey
ALTER TABLE "EventSidebarCta" ADD CONSTRAINT "EventSidebarCta_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
