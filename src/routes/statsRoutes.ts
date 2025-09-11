import express from "express";
import { prisma } from "../prismaClient";
import Decimal from "decimal.js";

const router = express.Router();

interface Holding {
  symbol: string;
  units: string;
  latestPriceInr: string;
  valueInr: string;
}

router.get("/portfolio/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) return res.status(400).json({ error: "userId required" });

    // Use Prisma groupBy instead of raw SQL
    const holdingsRaw = await prisma.stockUnitLine.groupBy({
      by: ["symbol"],
      where: { userId },
      _sum: { unitsDelta: true },
    });

    const holdings: Holding[] = [];
    let totalInr = new Decimal(0);

    for (const row of holdingsRaw) {
      const units = new Decimal(row._sum.unitsDelta?.toString() || "0");
      if (units.lte(0)) continue;

      // Get latest price
      const priceRow = await prisma.priceHistory.findFirst({
        where: { symbol: row.symbol },
        orderBy: { fetchedAt: "desc" },
      });
      const price = priceRow
        ? new Decimal(priceRow.priceInr.toString())
        : new Decimal(0);

      const value = price.mul(units);
      totalInr = totalInr.plus(value);

      holdings.push({
        symbol: row.symbol,
        units: units.toFixed(6),
        latestPriceInr: price.toFixed(4),
        valueInr: value.toFixed(4),
      });
    }

    return res.json({
      userId,
      holdings,
      portfolioInr: totalInr.toFixed(4),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/stats/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) return res.status(400).json({ error: "userId required" });

    // Define start and end of today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // 1️⃣ Total shares rewarded today from RewardEvent
    const rewardedTodayRaw = await prisma.rewardEvent.groupBy({
      by: ["symbol"],
      where: {
        userId,
        timestamp: { gte: start, lt: end },
      },
      _sum: { units: true },
    });

    const totalSharesRewardedToday = rewardedTodayRaw.map((r: any) => ({
      symbol: r.symbol,
      units: r._sum.units?.toString() || "0",
    }));

    // 2️⃣ Current holdings per stock from StockUnitLine
    const holdingsRaw = await prisma.stockUnitLine.groupBy({
      by: ["symbol"],
      where: { userId },
      _sum: { unitsDelta: true },
    });

    // 3️⃣ Compute portfolio INR value using latest price from PriceHistory
    let portfolioInr = new Decimal(0);
    for (const row of holdingsRaw) {
      const units = new Decimal(row._sum.unitsDelta?.toString() || "0");
      if (units.lte(0)) continue;

      const priceRow = await prisma.priceHistory.findFirst({
        where: { symbol: row.symbol },
        orderBy: { fetchedAt: "desc" },
      });

      const price = priceRow
        ? new Decimal(priceRow.priceInr.toString())
        : new Decimal(0);
      portfolioInr = portfolioInr.plus(price.mul(units));
    }

    return res.json({
      totalSharesRewardedToday,
      portfolioInr: portfolioInr.toFixed(4),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/historical-inr/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const firstReward = await prisma.rewardEvent.findFirst({
      where: { userId },
      orderBy: { timestamp: "asc" },
    });
    if (!firstReward) return res.json({ data: [] });

    const startDate = new Date(firstReward.timestamp);
    startDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(todayStart);
    yesterday.setDate(todayStart.getDate() - 1);

    const events = await prisma.rewardEvent.findMany({
      where: { userId, timestamp: { lt: todayStart } },
      orderBy: { timestamp: "asc" },
    });

    const days: Date[] = [];
    for (
      let d = new Date(startDate);
      d <= yesterday;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }

    const results: Array<any> = [];

    for (const day of days) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dailyEvents = events.filter(
        (e: any) => e.timestamp >= dayStart && e.timestamp <= dayEnd
      );

      let dailyRewardInr = new Decimal(0);

      // cumulative units up to dayEnd grouped by symbol
      const cumulative: Record<string, Decimal> = {};
      for (const e of events.filter((ev: any) => ev.timestamp <= dayEnd)) {
        if (!cumulative[e.symbol]) cumulative[e.symbol] = new Decimal(0);
        cumulative[e.symbol] = cumulative[e.symbol].plus(
          new Decimal(e.units.toString())
        );
      }

      const symbols = Array.from(
        new Set([
          ...dailyEvents.map((d: any) => d.symbol),
          ...Object.keys(cumulative),
        ])
      );

      let cumulativeInr = new Decimal(0);

      for (const symbol of symbols) {
        const priceRow = await prisma.priceHistory.findFirst({
          where: { symbol, fetchedAt: { lte: dayEnd } },
          orderBy: { fetchedAt: "desc" },
        });

        let price = priceRow
          ? new Decimal(priceRow.priceInr.toString())
          : new Decimal(0);

        // daily
        const dailyUnits = dailyEvents
          .filter((e: any) => e.symbol === symbol)
          .reduce(
            (acc: any, cur: any) => acc.plus(new Decimal(cur.units.toString())),
            new Decimal(0)
          );

        dailyRewardInr = dailyRewardInr.plus(dailyUnits.mul(price));

        // cumulative value:
        const cumUnits = cumulative[symbol] ?? new Decimal(0);
        cumulativeInr = cumulativeInr.plus(cumUnits.mul(price));
      }

      results.push({
        date: dayStart.toISOString().slice(0, 10),
        dailyRewardInr: dailyRewardInr.toFixed(4),
        cumulativeInr: cumulativeInr.toFixed(4),
      });
    }

    return res.json({ data: results });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
