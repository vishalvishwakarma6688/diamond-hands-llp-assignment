import { prisma } from "../prismaClient";
import { processReward } from "../services/rewardService";

export const reward = async (req: any, res: any) => {
    try {
        const { userId, symbol, units, idempotencyKey, timestamp } = req.body;
        if (!userId || !symbol || !units) {
            return res.status(400).json({ error: "userId, symbol, units required" });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }

        const result = await processReward({
            userId,
            symbol,
            units,
            idempotencyKey,
            timestamp,
        });
        return res.json(result);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message || "server error" });
    }
}

export const getTodayStock = async (req: any, res: any) => {
    try {
        const { userId } = req.params;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const rewards = await prisma.rewardEvent.findMany({
            where: {
                userId,
                timestamp: { gte: start, lt: end },
            },
            orderBy: { timestamp: "desc" },
        });
        return res.json({ date: start.toISOString().slice(0, 10), rewards });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}