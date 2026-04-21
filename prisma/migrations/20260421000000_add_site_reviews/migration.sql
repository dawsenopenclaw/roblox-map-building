-- CreateTable
CREATE TABLE "SiteReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "review" VARCHAR(200) NOT NULL,
    "stars" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteReview_approved_createdAt_idx" ON "SiteReview"("approved", "createdAt");

-- CreateIndex
CREATE INDEX "SiteReview_userId_idx" ON "SiteReview"("userId");

-- AddForeignKey
ALTER TABLE "SiteReview" ADD CONSTRAINT "SiteReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
