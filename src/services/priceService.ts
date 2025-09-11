// src/services/priceService.ts
import { prisma } from "../prismaClient";
import Decimal from "decimal.js";

const SYMBOL_BASES: Record<string, number> = {
  RELIANCE: 2500,
  TCS: 3200,
  INFY: 1500,
};

export async function fetchAndSavePricesForKnownSymbols() {
  const symbolRows = await prisma.$queryRaw<
    Array<{ symbol: string }>
  >`SELECT DISTINCT symbol FROM "PriceHistory" UNION SELECT DISTINCT symbol FROM "RewardEvent"`;
  const symbols = symbolRows.map((r: any) => r.symbol).filter(Boolean);
  if (symbols.length === 0) {
    symbols.push(...Object.keys(SYMBOL_BASES));
  }
  for (const s of symbols) {
    const last = await prisma.priceHistory.findFirst({
      where: { symbol: s },
      orderBy: { fetchedAt: "desc" },
    });
    let newPrice: Decimal;
    if (last) {
      const lastVal = new Decimal(last.priceInr.toString());
      const pct = (Math.random() - 0.5) * 0.02; // +/-1%
      newPrice = lastVal.mul(new Decimal(1 + pct));
    } else {
      const base = SYMBOL_BASES[s] ?? 1000 + Math.random() * 1000;
      const jitter = 1 + (Math.random() - 0.5) * 0.1;
      newPrice = new Decimal(base).mul(jitter);
    }
    await prisma.priceHistory.create({
      data: {
        symbol: s,
        priceInr: newPrice.toFixed(4),
      },
    });
  }
}

export async function getLatestPrice(symbol: string) {
  const p = await prisma.priceHistory.findFirst({
    where: { symbol },
    orderBy: { fetchedAt: "desc" },
  });
  if (!p) return null;
  return p.priceInr;
}
