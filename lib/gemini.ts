import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined. Please set it in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getIntelligenceBriefing(news: string[]) {
  try {
    const ai = getAi();
    const prompt = `Analyze these top 5 news stories and provide a sophisticated 2-sentence "Intelligence Briefing" for the user. Focus on high-level impact and connections.
    
    Stories:
    ${news.join('\n')}
    
    Format: A single paragraph with exactly two sentences. Professional but immersive tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Briefing Error:", error);
    return "Intelligence systems are currently synthesizing reports. Check back shortly for your personalized briefing.";
  }
}

export async function getArticleSummary(title: string, content: string) {
  try {
    const ai = getAi();
    const prompt = `Provide a concise, hard-hitting executive summary for this news article. Maximum 20 words.
    
    Title: ${title}
    Content: ${content}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return content.slice(0, 100) + "...";
  }
}
