import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rewardRoutes from "./routes/rewardRoutes";
import statsRoutes from "./routes/statsRoutes";
import { fetchAndSavePricesForKnownSymbols } from "./services/priceService";
import cron from "node-cron";
import { prisma } from "./prismaClient";

dotenv.config();
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => res.send("Stocky backend alive"));

// routes
app.use("/reward", rewardRoutes);
app.use("/stats", statsRoutes);

app.get("/debug/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
})

app.listen(PORT, async () => {
  console.log(`Server listening on ${PORT}`);

  try {
    await fetchAndSavePricesForKnownSymbols();
    console.log("Initial prices seeded.");
  } catch (e) {
    console.error("Price seeding failed:", e);
  }

  const minutes = Number(process.env.PRICE_FETCH_INTERVAL_MINUTES ?? 60);
  if (minutes === 60) {
    cron.schedule("0 * * * *", async () => {
      console.log("Hourly price fetch running...");
      await fetchAndSavePricesForKnownSymbols();
    });
  } else {
    cron.schedule(`*/${minutes} * * * *`, async () => {
      console.log(`Price fetch every ${minutes} minutes running...`);
      await fetchAndSavePricesForKnownSymbols();
    });
  }
});
