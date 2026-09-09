/**
 * Cliente HTTP para consumir el microservicio independiente sunat-billing-api (Bun + Hono)
 */

const SUNAT_API_URL = process.env.SUNAT_API_URL || "http://localhost:3001";
const SUNAT_API_KEY = process.env.SUNAT_API_KEY || "novamarket_secret_api_key_2026";

export interface ApiCpeInput {
  tipoComprobante: "01" | "03" | "07" | "08";
  serie: string;
  numero: number;
  fechaEmision?: string;
  horaEmision?: string;
  moneda?: "PEN" | "USD";
  emisor?: {
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    direccion?: string;
    ubigeo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    usuarioSol?: string;
    claveSol?: string;
    isBeta?: boolean;
  };
  cliente: {
    tipoDoc: "1" | "6" | "4" | "7" | "0" | "dni" | "ruc" | "ce" | "pasaporte";
    numDoc: string;
    nombre: string;
    direccion?: string;
    email?: string;
  };
  items: Array<{
    sku: string;
    descripcion: string;
    unidadMedida?: string;
    cantidad: number;
    precioUnitario: number;
    valorUnitario?: number;
    tipoAfectacionIgv?: "10" | "20" | "30";
  }>;
  medioPago?: "efectivo" | "tarjeta" | "yape" | "plin" | "transferencia" | "credito" | "mixto";
  documentoModificado?: {
    tipoDoc: "01" | "03";
    serieNumero: string;
    motivoCodigo: "01" | "02" | "06" | "07" | "04";
    motivoDescripcion: string;
  };
  enviarASunat?: boolean;
}

export interface ApiCpeResponse {
  success: boolean;
  comprobante: string;
  tipoComprobante: string;
  hashSunat: string;
  qrString: string;
  xmlBase64: string;
  cdrBase64?: string;
  sunatResponse: {
    code: string;
    message: string;
    estado: "ACEPTADO" | "RECHAZADO" | "OBSERVADO" | "EN_COLA";
  };
  totales: {
    gravadas: number;
    exoneradas: number;
    inafectas: number;
    igv: number;
    total: number;
  };
  error?: string;
}

/**
 * Emite una Factura, Boleta o Nota a través de sunat-billing-api
 */
export async function emitirComprobanteApi(payload: ApiCpeInput): Promise<ApiCpeResponse> {
  const res = await fetch(`${SUNAT_API_URL}/api/v1/cpe/emitir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SUNAT_API_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status} al emitir comprobante en la API.`);
  }

  return data;
}

/**
 * Consulta de RUC en SUNAT vía API
 */
export async function consultarRucApi(ruc: string) {
  const res = await fetch(`${SUNAT_API_URL}/api/v1/consultas/ruc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SUNAT_API_KEY,
    },
    body: JSON.stringify({ ruc }),
    signal: AbortSignal.timeout(5000),
  });

  return await res.json();
}

/**
 * Consulta de DNI vía API
 */
export async function consultarDniApi(dni: string) {
  const res = await fetch(`${SUNAT_API_URL}/api/v1/consultas/dni`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SUNAT_API_KEY,
    },
    body: JSON.stringify({ dni }),
    signal: AbortSignal.timeout(5000),
  });

  return await res.json();
}

/**
 * Health check y telemetría de SUNAT
 */
export async function checkSunatHealthApi() {
  try {
    const res = await fetch(`${SUNAT_API_URL}/api/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      status: "offline",
      error: err.message,
    };
  }
}
