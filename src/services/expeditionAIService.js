// services/expeditionAIService.js
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseExpenseDetailsService = async (text, members) => {
    try {
        const model = "gemini-2.5-flash";
        const memberMap = members.map(m => ({ id: m.id, name: m.name })).join(", ");

        const prompt = `
      Analyze this expense text: "${text}"
      
      Context Members: [${memberMap}]
      
      Task:
      1. Extract a short description.
      2. Extract the amount if present.
      3. Categorize into: Food & Drink, Transportation, Accommodation, Equipment, Activities, Other.
      4. Identify which members are involved based on names mentioned. If 'everyone' or 'all' or no specific names are mentioned, include everyone.
      5. Suggest a split method (usually EQUAL).
      
      Return JSON with keys: description, amount, category, involvedMemberIds (array of matched IDs), splitMethod.
    `;

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

        const context = `
      You are the ExpeditionPay AI Assistant. A helpful, rugged, and smart outdoor guide and accountant.
      
      CURRENT EXPEDITION DATA:
      Name: "${expedition.name}"
      Description: "${expedition.description}"
      Members: ${memberNames}
      Total Cost So Far: $${totalCost.toFixed(2)}
      
      EXPENSES LOG:
      ${expenseSummary}
      
      EQUIPMENT LIST:
      ${equipmentSummary}
      
      USER QUERY: "${query}"
      
      INSTRUCTIONS:
      1. If asked about costs, analyze the Expenses Log. Tell who spent what if asked.
      2. If asked about gear, analyze the Equipment List. Suggest missing items based on the trip description (e.g. if hiking, suggest boots).
      3. If asked about settling debts, explain generally that the 'Settlement' tab handles the math, but you can give a rough estimate.
      4. Be concise. Use emojis relevant to outdoors/finance.
    `;

        const response = await ai.models.generateContent({ model, contents: context, config: { temperature: 0.7 } });
        return response.text?.trim() || "I couldn't process that request.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I'm having trouble right now.";
    }
};