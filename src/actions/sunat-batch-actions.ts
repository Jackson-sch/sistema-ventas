"use server";

import { revalidatePath } from "next/cache";
import { buildResumenDiarioXml, ResumenDiarioInput } from "@/lib/sunat/rc-builder";
import { buildComunicacionBajasXml, ComunicacionBajaInput } from "@/lib/sunat/ra-builder";

export interface SunatBatchItem {
  id: string;
  tipo: "RC" | "RA";
  identificador: string; // ej: RC-20260817-001 o RA-20260817-001
  fechaReferencia: string; // YYYY-MM-DD
  fechaEnvio: string;
  totalComprobantes: number;
  montoTotal?: number;
  ticketSunat: string;
  estadoSunat: "ACEPTADO" | "EN_PROCESO" | "RECHAZADO";
  mensajeCdr: string;
  hashSunat: string;
  xmlUrl?: string;
}

const DEMO_BATCHES: SunatBatchItem[] = [
  {
    id: "batch-1",
    tipo: "RC",
    identificador: "RC-20260817-001",
    fechaReferencia: "2026-08-17",
    fechaEnvio: "17/08/2026 22:30",
    totalComprobantes: 42,
    montoTotal: 1845.5,
    ticketSunat: "1723948572910",
    estadoSunat: "ACEPTADO",
    mensajeCdr: "El Resumen Diario RC-20260817-001 ha sido ACEPTADO por SUNAT con éxito.",
    hashSunat: "n8YF82kd9Lq1+0mX=",
  },
  {
    id: "batch-2",
    tipo: "RA",
    identificador: "RA-20260817-001",
    fechaReferencia: "2026-08-16",
    fechaEnvio: "17/08/2026 14:15",
    totalComprobantes: 1,
    montoTotal: 450.0,
    ticketSunat: "1723912984712",
    estadoSunat: "ACEPTADO",
    mensajeCdr: "La Comunicación de Bajas RA-20260817-001 ha sido ACEPTADA. Factura F001-000124 anulada.",
    hashSunat: "k9xL82pd9Aq1+4pZ=",
  },
  {
    id: "batch-3",
    tipo: "RC",
    identificador: "RC-20260816-001",
    fechaReferencia: "2026-08-16",
    fechaEnvio: "16/08/2026 23:10",
    totalComprobantes: 68,
    montoTotal: 3420.0,
    ticketSunat: "1723849182741",
    estadoSunat: "ACEPTADO",
    mensajeCdr: "El Resumen Diario RC-20260816-001 ha sido ACEPTADO por SUNAT.",
    hashSunat: "z1wP82kd9Lq1+8kL=",
  },
];

let inMemoryBatches = [...DEMO_BATCHES];

export async function getSunatBatchesAction(): Promise<SunatBatchItem[]> {
  return inMemoryBatches;
}

export async function generateDailySummaryAction(
  fechaComprobantes: string
): Promise<{ success: boolean; batch?: SunatBatchItem; error?: string }> {
  try {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const correlativo = String(inMemoryBatches.filter((b) => b.tipo === "RC").length + 1).padStart(3, "0");
    const rcId = `RC-${todayStr}-${correlativo}`;

    const { xml, hashSunat } = buildResumenDiarioXml({
      emisorRuc: "20608945123",
      emisorRazonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
      emisorNombreComercial: "NovaMarket",
      resumenId: rcId,
      fechaEmisionComprobantes: fechaComprobantes || new Date().toISOString().slice(0, 10),
      fechaGeneracionResumen: new Date().toISOString().slice(0, 10),
      items: [
        {
          linea: 1,
          tipoDocumento: "03",
          serie: "B001",
          numeroInicio: 101,
          numeroFin: 145,
          estadoOperacion: "1",
          moneda: "PEN",
          totalGravado: 1850.0,
          totalExonerado: 0,
          totalInafecto: 0,
          totalOtrosCargos: 0,
          totalIgv: 333.0,
          totalVenta: 2183.0,
        },
      ],
    });

    const newBatch: SunatBatchItem = {
      id: `batch-${Date.now()}`,
      tipo: "RC",
      identificador: rcId,
      fechaReferencia: fechaComprobantes || new Date().toISOString().slice(0, 10),
      fechaEnvio: new Date().toLocaleString("es-PE"),
      totalComprobantes: 45,
      montoTotal: 2183.0,
      ticketSunat: `${Date.now()}`.substring(0, 13),
      estadoSunat: "ACEPTADO",
      mensajeCdr: `El Resumen Diario ${rcId} ha sido procesado y ACEPTADO por SUNAT (Ticket emitido y cerrado).`,
      hashSunat,
    };

    inMemoryBatches.unshift(newBatch);
    revalidatePath("/ventas/resumenes");
    return { success: true, batch: newBatch };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al emitir resumen diario RC." };
  }
}

export async function sendVoidedDocumentAction(
  comprobante: string, // ej: F001-0004512
  motivo: string
): Promise<{ success: boolean; batch?: SunatBatchItem; error?: string }> {
  try {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const correlativo = String(inMemoryBatches.filter((b) => b.tipo === "RA").length + 1).padStart(3, "0");
    const raId = `RA-${todayStr}-${correlativo}`;

    const [serie, numeroStr] = comprobante.split("-");
    const numero = parseInt(numeroStr || "1", 10);

    const { xml, hashSunat } = buildComunicacionBajasXml({
      emisorRuc: "20608945123",
      emisorRazonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
      bajaId: raId,
      fechaEmisionDocumentos: new Date().toISOString().slice(0, 10),
      fechaGeneracionBaja: new Date().toISOString().slice(0, 10),
      items: [
        {
          linea: 1,
          tipoDocumento: "01",
          serie: serie || "F001",
          numero: isNaN(numero) ? 1 : numero,
          motivoBaja: motivo || "Error en digitación de RUC o anulación por devolución",
        },
      ],
    });

    const newBatch: SunatBatchItem = {
      id: `batch-${Date.now()}`,
      tipo: "RA",
      identificador: raId,
      fechaReferencia: new Date().toISOString().slice(0, 10),
      fechaEnvio: new Date().toLocaleString("es-PE"),
      totalComprobantes: 1,
      montoTotal: 0,
      ticketSunat: `${Date.now()}`.substring(0, 13),
      estadoSunat: "ACEPTADO",
      mensajeCdr: `La Comunicación de Bajas ${raId} fue ACEPTADA. El comprobante ${comprobante} ha sido dado de baja en SUNAT.`,
      hashSunat,
    };

    inMemoryBatches.unshift(newBatch);
    revalidatePath("/ventas/resumenes");
    return { success: true, batch: newBatch };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al enviar Comunicación de Bajas RA." };
  }
}
