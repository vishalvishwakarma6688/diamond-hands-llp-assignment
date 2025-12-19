import express from "express";
import { getHistoricalInr, getPortfolio, getStats } from "../controllers/statsController";

const router = express.Router();

router.get("/portfolio/:userId", getPortfolio);
router.get("/stats/:userId", getStats);
router.get("/historical-inr/:userId", getHistoricalInr);

export default router;
