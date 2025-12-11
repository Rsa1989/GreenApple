
import { GoogleGenAI } from "@google/genai";

// Backup Public API (AwesomeAPI - Free and Reliable for USD-BRL)
const fetchFromPublicApi = async (): Promise<{ rate: number; source: string } | null> => {
  try {
    const response = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    if (!response.ok) return null;
    
    const data = await response.json();
    // AwesomeAPI returns { USDBRL: { bid: "5.50", ... } }
    if (data.USDBRL && data.USDBRL.bid) {
      return {
        rate: parseFloat(data.USDBRL.bid),
        source: "AwesomeAPI (Mercado em Tempo Real)"
      };
    }
    return null;
  } catch (error) {
    console.warn("Public API fallback failed:", error);
    return null;
  }
};

export const fetchCurrentExchangeRate = async (): Promise<{ rate: number; source?: string } | null> => {
  const apiKey = process.env.API_KEY;

  // 1. Try Gemini First (if API Key exists)
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Qual é a cotação atual do dólar comercial (USD) para Reais (BRL)? Pesquise no Google. Retorne APENAS um JSON: { \"rate\": 5.50 }",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let text = response.text;
      
      if (text) {
        // Cleaning markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        // Find JSON object
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1) {
            const jsonStr = text.substring(startIndex, endIndex + 1);
            try {
                const data = JSON.parse(jsonStr);
                if (data.rate && typeof data.rate === 'number') {
                    
                    // Try to get source metadata
                    let source = "Google Search (IA)";
                    // @ts-ignore
                    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                    if (chunks && Array.isArray(chunks) && chunks.length > 0) {
                         // @ts-ignore
                         const domains = chunks.map(c => c.web?.uri ? new URL(c.web.uri).hostname.replace('www.','') : null).filter(Boolean);
                         if (domains.length > 0) source = `Google (${domains[0]})`;
                    }

                    return { rate: data.rate, source };
                }
            } catch (e) {
                console.warn("Gemini JSON parse error, trying regex...");
            }
        }
        
        // Fallback Regex for Gemini text
        const rateMatch = text.match(/(\d+[.,]\d{2,})/);
        if (rateMatch) {
             return { 
                 rate: parseFloat(rateMatch[0].replace(',', '.')), 
                 source: "Google Search (IA Estimado)" 
             };
        }
      }
    } catch (error) {
      console.warn("Gemini API failed, switching to backup...", error);
      // Continue to fallback below
    }
  }

  // 2. Fallback: Public API
  // If Gemini failed, API key is missing, or parsing failed, use the reliable public API
  return await fetchFromPublicApi();
};
