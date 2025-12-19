import { prisma } from "../prismaClient";
import Decimal from "decimal.js";
import { computeFees } from "../utils/money";
import { getLatestPrice } from "./priceService";

type RewardRequest = {
  userId: string;
  symbol: string;
  units: string | number;
  idempotencyKey?: string | null;
  timestamp?: string | Date;
};

export async function processReward(req: RewardRequest) {
  const { userId, symbol } = req;
  const units = new Decimal(req.units);
  if (units.lte(0)) throw new Error("units must be > 0");
  if (req.idempotencyKey) {
    const existing = await prisma.rewardEvent.findUnique({
      where: { idempotencyKey: req.idempotencyKey },
      include: { journalEntry: true },
    });
    if (existing) {
      return { alreadyProcessed: true, reward: existing };
    }
  }
  let priceVal = await getLatestPrice(symbol) as any;
  if (!priceVal) {
    priceVal = "1000.00" as any;
  }
  const pricePerUnit = new Decimal(priceVal.toString());
  const gross = pricePerUnit.mul(units);
  const fees = computeFees(gross);
  const totalInr = gross.plus(fees.totalFees);
  const now = req.timestamp ? new Date(req.timestamp) : new Date();
  const result = await prisma.$transaction(async (tx: any) => {
    // 1) Create JournalEntry
    const journal = await tx.journalEntry.create({
      data: {
        description: `Reward ${units.toString()} ${symbol} to user ${userId} at ${now.toISOString()}`,
      },
    });
    await tx.journalLine.createMany({
      data: [
        {
          journalEntryId: journal.id,
          account: `User:${userId}:Stock:${symbol}`,
          amountInr: gross.toFixed(4),
          entryType: "debit",
        },
        {
          journalEntryId: journal.id,
          account: `FeeExpense`,
          amountInr: fees.totalFees.toFixed(4),
          entryType: "debit",
        },
        {
          journalEntryId: journal.id,
          account: `Cash/Bank`,
          amountInr: totalInr.toFixed(4),
          entryType: "credit",
        },
      ],
    });
    await tx.stockUnitLine.create({
      data: {
        journalEntryId: journal.id,
        userId,
        symbol,
        unitsDelta: units.toFixed(6),
      },
    });
    const reward = await tx.rewardEvent.create({
      data: {
        userId,
        symbol,
        units: units.toFixed(6),
        pricePerUnit: pricePerUnit.toFixed(4),
        feesInr: fees.totalFees.toFixed(4),
        totalInr: totalInr.toFixed(4),
        timestamp: now,
        idempotencyKey: req.idempotencyKey,
        journalEntryId: journal.id,
      },
    });
    return { reward, journal };
  });
  return { alreadyProcessed: false, ...result };
}
