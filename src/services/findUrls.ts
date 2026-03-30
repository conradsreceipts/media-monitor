import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./geminiService";

async function findCorrectUrls() {
  const apiKey = getApiKey();
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the current, working news or media page URLs for these specific Eastern Cape digital news platforms. 
      I need the EXACT URL that contains the news articles, not just the homepage.
      
      Sources:
      - Skawara News
      - Eastern Cape Mirror
      - Ikamva Lisezandleni Zethu
      - The New Era
      - The Voice of the People
      - Barkly East Reporter
      - Mthatha Express
      - PE Express
      - Kouga Express
      - UD News
      - Aliwal Weekblad
      
      For each, provide:
      - Name
      - Exact URL to the NEWS/MEDIA section
      - Category (Local)
      - Type (scrape)
      - Sphere (Local)
      - Location (City/Region)
      
      Output as a JSON array of objects.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    console.log(response.text);
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

findCorrectUrls();
