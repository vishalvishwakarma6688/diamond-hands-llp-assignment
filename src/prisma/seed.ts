import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice" },
  });

  const symbols = ["RELIANCE", "TCS", "INFY"];
  for (const s of symbols) {
    await prisma.priceHistory.create({
      data: { symbol: s, priceInr: "2500.00" },
    });
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
