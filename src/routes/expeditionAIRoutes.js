
// routes/expeditionAIRoutes.js
import express from "express";
import { parseExpenseDetails, getExpeditionAssistantResponse } from "../controllers/expeditionAIController.js";

const router = express.Router();

router.post("/parse-expense", parseExpenseDetails);
router.post("/assistant", getExpeditionAssistantResponse);

export default router;