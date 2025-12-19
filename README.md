Stocky Backend API

A Node.js + Express backend using Prisma ORM that manages stock rewards, portfolios, and statistics with INR calculations.

Tech Stack
Node.js
Express.js
TypeScript
Prisma ORM
Decimal.js (for precise financial calculations)
PostgreSQL / SQLite (via Prisma)
node-cron (price seeding)

📂 Project Setup

1️⃣ Clone Repository
git clone https://github.com/vishalvishwakarma6688/diamond-hands-llp-assignment
cd diamond-hands-llp-assignment

2️⃣ Install Dependencies
npm install

3️⃣ Environment Variables
Create a .env file in the root:
DATABASE_URL=""
PORT=4000
PRICE_FETCH_INTERVAL_MINUTES=60

4️⃣ Prisma Setup
Generate Prisma Client
npx prisma generate

🌱 Initial Seed Data

The following users are pre-seeded in the database and can be used directly for testing.

[
  {
    "id": "cmfez1nvx0000i9qk6yvo7422",
    "email": "alice@example.com",
    "name": "Alice"
  },
  {
    "id": "cmfeztmdh0000i9202t0spgef",
    "email": null,
    "name": "Vishal"
  }
]
Use these userId values in all API requests.

▶️ Start Server
npm run dev
http://localhost:4000

✅ Base Health Check
GET /
Response:
Stocky backend alive

🔁 Reward Routes
Base path:
/reward

1️⃣ Create / Get Reward
POST /reward/getreward
Body
{
  "userId": "cmfez1nvx0000i9qk6yvo7422",
  "symbol": "AAPL",
  "units": 10,
  "idempotencyKey": "reward-alice-001",
  "timestamp": "2025-12-18T11:00:00Z"
}

2️⃣ Get Today’s Rewards
GET /reward/today-stocks/:userId
Example:
GET /reward/today-stocks/cmfez1nvx0000i9qk6yvo7422

📊 Stats Routes
Base path:
/stats

1️⃣ Portfolio
GET /stats/portfolio/:userId
Example:
GET /stats/portfolio/cmfez1nvx0000i9qk6yvo7422

2️⃣ Daily Stats (Today)
GET /stats/stats/:userId
Example:
GET /stats/stats/cmfez1nvx0000i9qk6yvo7422

3️⃣ Historical INR (Time Series)
GET /stats/historical-inr/:userId
Example:
GET /stats/historical-inr/cmfez1nvx0000i9qk6yvo7422
