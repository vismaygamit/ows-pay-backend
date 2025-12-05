// controllers/expeditionAIController.js
import { parseExpenseDetailsService, getExpeditionAssistantResponseService } from "../services/expeditionAIService.js";

export const parseExpenseDetails = async (req, res) => {
    const { text, members } = req.body;
    const data = await parseExpenseDetailsService(text, members);
    res.json(data);
};

export const getExpeditionAssistantResponse = async (req, res) => {
    const { query, expedition } = req.body;
    const result = await getExpeditionAssistantResponseService(query, expedition);
    res.json({ response: result });
};




