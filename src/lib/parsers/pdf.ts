import { extractText } from "unpdf";

export interface PdfParseDiagnostics {
  text: string;
  pageCount: number;
  isLikelyScanned: boolean;
  warnings: string[];
}

export async function parsePdfDetailed(
  buffer: ArrayBuffer | Uint8Array
): Promise<PdfParseDiagnostics> {
  try {
    const uint8 =
      buffer instanceof Uint8Array
        ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        : new Uint8Array(buffer);

    const { text, totalPages } = await extractText(uint8);
    const pagesArray = Array.isArray(text) ? text : [text || ""];
    const pageCount = totalPages || pagesArray.length || 1;
    const fullText = pagesArray.join("\n\n");

    const cleaned = fullText
      .replace(/\r\n/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const warnings: string[] = [];
    const isLikelyScanned = cleaned.length < 60 * Math.max(1, pageCount);

    if (pageCount > 2) {
      warnings.push(
        `Seu PDF possui ${pageCount} páginas. Recrutadores e sistemas ATS priorizam currículos objetivos de 1 a 2 páginas.`
      );
    }

    // Heurística de múltiplas colunas / tabelas quebradas no OCR
    const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
    const veryShortLines = lines.filter((l) => l.length > 0 && l.length < 18).length;
    if (lines.length > 25 && veryShortLines / lines.length > 0.48) {
      warnings.push(
        "Detectamos fragmentação alta de linhas (comum em currículos de 2 colunas ou Canva). O AstraCV converterá a saída para coluna única certificada para OCR."
      );
    }

    return {
      text: cleaned,
      pageCount,
      isLikelyScanned,
      warnings,
    };
  } catch (error) {
    console.error("Erro ao fazer parse do PDF:", error);
    throw new Error(
      "Falha ao ler o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido por senha."
    );
  }
}

export async function parsePdfBuffer(
  buffer: ArrayBuffer | Uint8Array
): Promise<string> {
  const res = await parsePdfDetailed(buffer);
  return res.text;
}
