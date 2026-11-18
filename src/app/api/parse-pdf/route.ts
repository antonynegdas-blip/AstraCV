import { NextRequest, NextResponse } from "next/server";
import { parsePdfDetailed } from "@/lib/parsers/pdf";
import { hasDocxMagicBytes, parseDocxBuffer } from "@/lib/parsers/docx";
import { extractPdfTextWithMultimodalOcr } from "@/lib/parsers/ocr";
import { checkRateLimitAsync } from "@/lib/ratelimit";
import {
  sanitizeRawText,
  assertServerEnvironment,
} from "@/lib/security/sanitizer";
import { validateRequestOrigin } from "@/lib/security/request";

assertServerEnvironment();

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Compatível com limite de payload Serverless da Vercel)

const SECURITY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(req: NextRequest) {
  try {
    // 1. Defesa Anti-CSRF / Validação de Origem
    const originCheck = validateRequestOrigin(req);
    if (!originCheck.valid) {
      return NextResponse.json(
        { error: originCheck.reason || "Origem da requisição não autorizada." },
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    // 2. Rate Limiting por IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = await checkRateLimitAsync(ip, 20, 60, "astracv_upload");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitos uploads em sequência. Aguarde alguns instantes." },
        { status: 429, headers: SECURITY_HEADERS }
      );
    }

    // 3. Processamento de FormData seguro
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Formato de formulário inválido." },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado." },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "O arquivo excede o limite máximo permitido de 4.5MB.",
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf");
    const isDocx = lowerName.endsWith(".docx");
    const isTxt = lowerName.endsWith(".txt") || lowerName.endsWith(".md");

    if (!isPdf && !isDocx && !isTxt) {
      return NextResponse.json(
        {
          error:
            "Formato inválido. São aceitos arquivos .pdf, .docx, .txt ou .md.",
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let extractedText = "";
    let pageCount = 1;
    let usedOcr = false;
    const warnings: string[] = [];

    if (isPdf) {
      // Validação de Magic Bytes (%PDF-)
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
      const headerString = String.fromCharCode(...headerBytes);
      if (!headerString.startsWith("%PDF")) {
        return NextResponse.json(
          {
            error:
              "Arquivo corrompido ou formato PDF inválido (assinatura binária rejeitada).",
          },
          { status: 400, headers: SECURITY_HEADERS }
        );
      }

      const pdfResult = await parsePdfDetailed(arrayBuffer);
      extractedText = pdfResult.text;
      pageCount = pdfResult.pageCount;
      warnings.push(...pdfResult.warnings);

      // Se o PDF for escaneado/imagem, tenta OCR Multimodal com Gemini
      if (pdfResult.isLikelyScanned && extractedText.length < 50) {
        const ocrText = await extractPdfTextWithMultimodalOcr(arrayBuffer);
        if (ocrText && ocrText.length >= 40) {
          extractedText = ocrText;
          usedOcr = true;
          warnings.push(
            "PDF escaneado detectado: o texto foi recuperado via OCR Multimodal. Recomendamos exportar a versão final em PDF/DOCX textual do AstraCV."
          );
        }
      }
    } else if (isDocx) {
      if (!hasDocxMagicBytes(arrayBuffer)) {
        return NextResponse.json(
          {
            error:
              "Arquivo corrompido ou formato DOCX inválido (assinatura ZIP/OOXML rejeitada).",
          },
          { status: 400, headers: SECURITY_HEADERS }
        );
      }
      extractedText = await parseDocxBuffer(arrayBuffer);
    } else {
      const decoder = new TextDecoder("utf-8");
      extractedText = decoder.decode(arrayBuffer);
    }

    const cleanedText = sanitizeRawText(extractedText, 35000);

    if (!cleanedText || cleanedText.length < 20) {
      return NextResponse.json(
        {
          error:
            "Não foi possível extrair texto legível deste documento. Caso seja um PDF escaneado sem chave de OCR ativa, cole o texto manualmente.",
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);

    return NextResponse.json(
      {
        success: true,
        text: cleanedText,
        charCount: cleanedText.length,
        fileName: safeFileName,
        format: isPdf ? "pdf" : isDocx ? "docx" : "txt",
        pageCount,
        usedOcr,
        warnings,
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (error: unknown) {
    console.error(
      "Erro protegido no processamento do documento:",
      error instanceof Error ? error.message : "Erro desconhecido"
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes("assinatura")
            ? error.message
            : "Falha segura ao processar o documento enviado. Tente novamente.",
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
