import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./geminiService";

async function findCorrectUrls() {
  // Use the provided API key directly for this discovery task
  const apiKey = getApiKey();
  
  console.log("SYSTEM: Initializing URL Discovery Engine...");
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the current news or media page URLs for all Eastern Cape municipalities (Local and District) and major local news outlets. 
      We need exactly 73 URLs. 
      
      Include:
      1. All 2 Metro Municipalities (Nelson Mandela Bay, Buffalo City)
      2. All 6 District Municipalities (Sarah Baartman, Amathole, Chris Hani, Joe Gqabi, OR Tambo, Alfred Nzo)
      3. All 31 Local Municipalities in Eastern Cape.
      4. Major local news outlets: SNL24 (The Rep, UD News, Mthatha Express, Go! & Express, PE Express, Barkly East Reporter, Midland News, Winterberg News), Grocott's Mail, Talk of the Town, Kouga Express, Algoa FM News, Graaff-Reinet Advertiser, St Francis Chronicle, Jeffreys Bay News, The Messenger, Pondoland Times, Skawara News, Eastern Cape Mirror, Ikamva Lisezandleni Zethu, Aliwal Weekblad.
      5. Provincial Government news.
      
      For each, provide:
      - Name
      - Exact URL to the NEWS/MEDIA section (not just the homepage)
      - Category (Government, News, Local)
      - Type (scrape)
      
      Output as a JSON array of objects with keys: "name", "url", "category", "type".`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    console.log("SUCCESS: URL Discovery complete.");
    console.log(response.text);
  } catch (error: any) {
    console.error("FATAL: URL Discovery failed.");
    console.error(error.message);
  }
}

findCorrectUrls();
