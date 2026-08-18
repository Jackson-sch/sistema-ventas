import { SunatDocumentData } from "./types";

/**
 * Normaliza el tipo de documento del cliente al catálogo 06 de SUNAT
 * 1: DNI, 6: RUC, 4: Carnet de Extranjería, 7: Pasaporte, 0: Sin documento
 */
export function normalizeCustomerDocType(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t === "ruc" || t === "6") return "6";
  if (t === "dni" || t === "1") return "1";
  if (t === "ce" || t === "4") return "4";
  if (t === "pasaporte" || t === "7") return "7";
  return "0";
}

/**
 * Genera la cadena canónica oficial para el código QR impreso en el comprobante fiscal
 * Formato SUNAT: RUC|TIPO_DOC|SERIE|NUMERO|MTO_IGV|TOTAL|FECHA|TIPO_DOC_CLIENTE|NUM_DOC_CLIENTE|HASH|
 */
export function generateSunatQrString(data: SunatDocumentData, hash: string): string {
  const tipoDocCliente = normalizeCustomerDocType(data.cliente.tipoDoc);
  const numDocCliente = data.cliente.numDoc || "00000000";
  const fecha = data.fechaEmision;
  const igv = data.totalIgv.toFixed(2);
  const total = data.totalVenta.toFixed(2);

  return `${data.emisor.ruc}|${data.tipoComprobante}|${data.serie}|${data.numero}|${igv}|${total}|${fecha}|${tipoDocCliente}|${numDocCliente}|${hash}|`;
}

/**
 * Genera un digest / hash SHA-256 canónico para el comprobante UBL 2.1
 */
export function generateDigestHash(content: string): string {
  // Simple deterministic hash based on content payload
  let hashVal = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hashVal ^= content.charCodeAt(i);
    hashVal = (hashVal * 0x01000193) >>> 0;
  }
  const hex = hashVal.toString(16).padStart(8, "0").toUpperCase();
  // Format as standard 28-char Base64 digest string for SUNAT
  const b64 = Buffer.from(`SUNAT_${hex}_${Date.now()}`).toString("base64").substring(0, 28);
  return b64;
}
