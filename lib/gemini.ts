import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function getIntelligenceBriefing(news: string[]) {
  try {
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
