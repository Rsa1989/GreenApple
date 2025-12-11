
import { GoogleGenAI } from "@google/genai";

export const fetchCurrentExchangeRate = async (): Promise<{ rate: number; source?: string } | null> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.warn("API Key Gemini não encontrada.");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Qual é a cotação exata do dólar comercial (USD) para Reais (BRL) hoje? Retorne APENAS um objeto JSON válido neste formato: { \"rate\": 5.50 }. Não use markdown.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text;
    if (!text) return null;

    // 1. Clean up markdown code blocks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // 2. Aggressive JSON extraction: Find the first '{' and the last '}'
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1) {
        text = text.substring(startIndex, endIndex + 1);
    } else {
        // Fallback: Try to find just a number if JSON fails
        const rateMatch = text.match(/(\d+[.,]\d{2,})/);
        if (rateMatch) {
             const rate = parseFloat(rateMatch[0].replace(',', '.'));
             return { rate, source: "Google Search (Estimado)" };
        }
    }

    try {
      const data = JSON.parse(text);
      
      let source = "Google Search";
      
      // Extract grounding metadata
      // @ts-ignore
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (groundingChunks && Array.isArray(groundingChunks)) {
        const sources = groundingChunks
          .map((chunk: any) => {
             if (chunk.web?.title) return chunk.web.title;
             if (chunk.web?.uri) {
                 try { return new URL(chunk.web.uri).hostname; } catch { return chunk.web.uri; }
             }
             return null;
          })
          .filter((s: string | null) => s);
        
        if (sources.length > 0) {
          source = [...new Set(sources)].join(", ");
        }
      }

      if (data.rate && typeof data.rate === 'number') {
        return {
          rate: data.rate,
          source: source
        };
      }
      return null;
    } catch (e) {
      console.warn("Failed to parse exchange rate JSON:", text);
      return null;
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
};
