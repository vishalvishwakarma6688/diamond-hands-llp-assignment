-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "units" DECIMAL(18,6) NOT NULL,
    "pricePerUnit" DECIMAL(18,4) NOT NULL,
    "feesInr" DECIMAL(18,4) NOT NULL,
    "totalInr" DECIMAL(18,4) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT,
    "journalEntryId" TEXT,

    CONSTRAINT "RewardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JournalEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "amountInr" DECIMAL(18,4) NOT NULL,
    "entryType" TEXT NOT NULL,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockUnitLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "userId" TEXT,
    "symbol" TEXT NOT NULL,
    "unitsDelta" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockUnitLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceHistory" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "priceInr" DECIMAL(18,4) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RewardEvent_idempotencyKey_key" ON "public"."RewardEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PriceHistory_symbol_fetchedAt_idx" ON "public"."PriceHistory"("symbol", "fetchedAt");

-- AddForeignKey
ALTER TABLE "public"."RewardEvent" ADD CONSTRAINT "RewardEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardEvent" ADD CONSTRAINT "RewardEvent_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "public"."JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "public"."JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockUnitLine" ADD CONSTRAINT "StockUnitLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "public"."JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockUnitLine" ADD CONSTRAINT "StockUnitLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
