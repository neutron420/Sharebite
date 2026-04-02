-- CreateTable
CREATE TABLE "HiveViolation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiveViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HiveViolation_userId_idx" ON "HiveViolation"("userId");

-- AddForeignKey
ALTER TABLE "HiveViolation" ADD CONSTRAINT "HiveViolation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
