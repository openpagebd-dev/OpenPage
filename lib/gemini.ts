import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    // Try to get the key from Next.js public env var
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // Exhaustive check for invalid, placeholder, or missing keys
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
      console.warn("Gemini API Key is missing. AI features will use fallback messages.");
      return null;
    }

    const isPlaceholder = apiKey === "MY_GEMINI_API_KEY" || 
                          apiKey === "undefined" || 
                          apiKey === "null" ||
                          apiKey.includes("YOUR_API_KEY") ||
                          apiKey.length < 5;

    if (isPlaceholder) {
      console.warn("Gemini API Key is a placeholder or invalid. AI features will use fallback messages.");
      return null;
    }
    
    try {
      // The SDK throws "An API Key must be set when running in a browser" if it doesn't like the key.
      // We must ensure that we never call this constructor with a bad key.
      aiInstance = new GoogleGenAI({ apiKey: apiKey.trim() });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI Engine:", e);
      return null;
    }
  }
  return aiInstance;
}

export async function getIntelligenceBriefing(news: string[]) {
  try {
    const ai = getAi();
    if (!ai) {
      return "Intelligence systems are initializing. Please check back shortly for your briefing.";
    }

    const prompt = `Analyze these top 5 news stories and provide a sophisticated 2-sentence "Intelligence Briefing" for the user. Focus on high-level impact and connections.
    
    Stories:
    ${news.join('\n')}
    
    Format: A single paragraph with exactly two sentences. Professional but immersive tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Intelligence systems are processing the latest signals.";
  } catch (error) {
    console.error("Gemini Briefing Error:", error);
    return "Intelligence systems are currently synthesizing reports. Check back shortly for your personalized briefing.";
  }
}

export async function getArticleSummary(title: string, content: string) {
  try {
    const ai = getAi();
    if (!ai) {
      return content.slice(0, 100) + "...";
    }

    const prompt = `Provide a concise, hard-hitting executive summary for this news article. Maximum 20 words.
    
    Title: ${title}
    Content: ${content}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });

    return response.text || content.slice(0, 100) + "...";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return content.slice(0, 100) + "...";
  }
}
