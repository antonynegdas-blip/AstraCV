import { GoogleGenAI } from "@google/genai";
import { assertServerEnvironment } from "@/lib/security/sanitizer";
import { isGeminiApiKeyConfigured } from "@/lib/gemini";

assertServerEnvironment();

/**
 * Fallback de OCR Multimodal para PDFs escaneados ou gerados como imagem (ex: Canva exportado como imagem)
 */
export async function extractPdfTextWithMultimodalOcr(
  buffer: ArrayBuffer | Uint8Array
): Promise<string | null> {
  if (!isGeminiApiKeyConfigured()) {
    return null;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY!;
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = Buffer.from(
      buffer instanceof Uint8Array
        ? buffer
        : new Uint8Array(buffer)
    ).toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
        {
          text: "Extraia fielmente todo o texto deste currículo em ordem lógica de leitura (coluna única), sem inventar informações e sem adicionar comentários externos.",
        },
      ],
      config: {
        temperature: 0.1,
      },
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.warn("OCR Multimodal indisponível para o PDF enviado:", error);
    return null;
  }
}

