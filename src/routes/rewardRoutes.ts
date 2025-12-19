import express from "express";
import { getTodayStock, reward } from "../controllers/rewardController";

const router = express.Router();

router.post("/getreward", reward);
router.get("/today-stocks/:userId", getTodayStock);

export default router;
