import mammoth from "mammoth";

/**
 * Verifica Magic Bytes de arquivo ZIP/OOXML (.docx começa com PK\x03\x04)
 */
export function hasDocxMagicBytes(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.byteLength < 4) return false;
  return (
    bytes[0] === 0x50 && // 'P'
    bytes[1] === 0x4b && // 'K'
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

export async function parseDocxBuffer(
  buffer: ArrayBuffer | Uint8Array
): Promise<string> {
  if (!hasDocxMagicBytes(buffer)) {
    throw new Error(
      "Arquivo corrompido ou formato DOCX inválido (assinatura binária rejeitada)."
    );
  }

  try {
    const nodeBuffer =
      buffer instanceof Uint8Array
        ? Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        : Buffer.from(buffer);

    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
    const cleaned = (result.value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return cleaned;
  } catch (error) {
    console.error("Erro ao fazer parse do DOCX:", error);
    throw new Error(
      "Falha ao ler o arquivo DOCX. Verifique se o documento não está corrompido ou protegido por senha."
    );
  }
}

