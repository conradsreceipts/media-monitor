import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./geminiService";

export async function findMhlontloUrl() {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Find the correct news or media release URL for Mhlontlo Local Municipality (mhlontlolm.gov.za). The current URL https://www.mhlontlolm.gov.za/news returns a 404.",
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  console.log(response.text);
}
