// services/expeditionAIService.js
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseExpenseDetailsService = async (text, members) => {
    try {
        const model = "gemini-2.5-flash";
        const memberMap = members.map(m => ({ id: m.id, name: m.name })).join(", ");

        const prompt = `Analyze this expense text: "${text}"

Context Members: [${memberMap}]

Task:
1. Extract a short description.
2. Extract the amount.
3. Categorize: Food & Drink, Transportation, Accommodation, Equipment, Activities, Other.
4. Identify members mentioned.
5. Suggest a split method.

Return JSON.`;
        const CATEGORY_ICONS = {
            FOOD: "🍔",
            TRANSPORT: "🚗",
            ACCOMMODATION: "⛺",
            EQUIPMENT: "🎒",
            ACTIVITY: "🎫",
            OTHER: "📝"
        };
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        category: { type: Type.STRING },
                        involvedMemberIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        splitMethod: { type: Type.STRING }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || "{}");

        let mappedCategory = CATEGORY_ICONS.OTHER;
        const cat = json.category?.toUpperCase() || "";
        if (cat.includes("FOOD")) mappedCategory = CATEGORY_ICONS.FOOD;
        else if (cat.includes("TRANSPORT")) mappedCategory = CATEGORY_ICONS.TRANSPORT;
        else if (cat.includes("ACCOMMODATION")) mappedCategory = CATEGORY_ICONS.ACCOMMODATION;
        else if (cat.includes("EQUIPMENT")) mappedCategory = CATEGORY_ICONS.EQUIPMENT;
        else if (cat.includes("ACTIVITY")) mappedCategory = CATEGORY_ICONS.ACTIVITY;

        return { ...json, category: mappedCategory };
    } catch (error) {
        console.error("Gemini Parse Error:", error);
        return {};
    }
};

export const getExpeditionAssistantResponseService = async (query, expedition) => {
    try {
        const model = "gemini-2.5-flash";

        const totalCost = expedition.expenses.reduce((sum, e) => sum + e.amount, 0);
        const memberNames = expedition.members.map(m => m.name).join(", ");
        const expenseSummary = expedition.expenses.map(e => `${e.description}: $${e.amount} (${e.category})`).join("\n");
        const equipmentSummary = expedition.equipment.map(e => `${e.name} (${e.isPacked ? 'Packed' : 'Not Packed'})`).join(", ");

        const context = `You are the ExpeditionPay AI Assistant.

Expedition: ${expedition.name}
Members: ${memberNames}
Total Cost: $${totalCost}

Expenses:
${expenseSummary}

Equipment:
${equipmentSummary}

User Query: "${query}"`;

        const response = await ai.models.generateContent({ model, contents: context, config: { temperature: 0.7 } });
        return response.text?.trim() || "I couldn't process that request.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I'm having trouble right now.";
    }
};