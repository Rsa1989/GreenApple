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
      contents: "Qual é a cotação exata do dólar comercial (USD) para Reais (BRL) hoje? Retorne APENAS um objeto JSON válido (sem markdown) com o campo 'rate' sendo um número (ex: 5.15).",
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" is not supported when using tools in the current API version
      },
    });

    let text = response.text;
    if (!text) return null;

    // Clean up markdown code blocks if present to ensure valid JSON
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // extract JSON object if there is surrounding text
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
        text = text.substring(startIndex, endIndex + 1);
    }

    try {
      const data = JSON.parse(text);
      
      let source = "Google Search";
      
      // Extract grounding metadata to provide accurate sources
      // @ts-ignore - Accessing groundingMetadata which may not be strictly typed in all versions
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