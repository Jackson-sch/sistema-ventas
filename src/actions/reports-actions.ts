"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSalesHistoryData } from "./data-fetchers";

export interface SireSaleRecord {
  id: string;
  periodo: string; // YYYYMM00
  cuo: string; // Código Único de Operación
  fechaEmision: string; // DD/MM/YYYY
  fechaVcto: string;
  tipoComprobante: "01" | "03" | "07";
  serie: string;
  numero: string;
  tipoDocCliente: "1" | "6" | "0" | "4";
  numDocCliente: string;
  razonSocialCliente: string;
  baseImponibleGravada: number;
  igv: number;
  inafecta: number;
  exonerada: number;
  montoTotal: number;
  moneda: "PEN" | "USD";
  tipoCambio: number;
  estadoComprobante: "1" | "2"; // 1 = Aceptado, 2 = Anulado
  codigoSunat: string;
}

export async function getSireSalesData(periodo: string = "202608"): Promise<SireSaleRecord[]> {
  try {
    const sales = await getSalesHistoryData();
    if (sales && sales.length > 0) {
      return sales.map((s, idx) => {
        const isFactura = s.tipo === "Factura";
        const isNC = s.tipo === "Nota de Crédito";
        const tipoComp = (isFactura ? "01" : isNC ? "07" : "03") as "01" | "03" | "07";
        const parts = s.comprobante.split("-");
        const serie = parts[0] || (isFactura ? "F001" : "B001");
        const numero = parts[1] || String(1000 + idx);

        const total = s.total;
        const base = +(total / 1.18).toFixed(2);
        const igv = +(total - base).toFixed(2);

        return {
          id: s.id,
          periodo: `${periodo}00`,
          cuo: `CUO-${(100000 + idx).toString()}`,
          fechaEmision: s.fecha || "16/08/2026",
          fechaVcto: s.fecha || "16/08/2026",
          tipoComprobante: tipoComp,
          serie,
          numero,
          tipoDocCliente: isFactura ? "6" : "1",
          numDocCliente: s.docNumero || "00000000",
          razonSocialCliente: s.cliente || "CLIENTES VARIOS",
          baseImponibleGravada: base,
          igv,
          inafecta: 0,
          exonerada: 0,
          montoTotal: total,
          moneda: "PEN",
          tipoCambio: 1.0,
          estadoComprobante: s.estadoSunat === "anulado" ? "2" : "1",
          codigoSunat: s.hashSunat?.substring(0, 8) || "SUNATOK",
        };
      });
    }
  } catch (err) {
    console.warn("getSireSalesData error:", err);
  }

  // Fallback demo data
  return [
    {
      id: "1",
      periodo: `${periodo}00`,
      cuo: "CUO-100001",
      fechaEmision: "16/08/2026",
      fechaVcto: "16/08/2026",
      tipoComprobante: "03",
      serie: "B001",
      numero: "00042918",
      tipoDocCliente: "1",
      numDocCliente: "45892144",
      razonSocialCliente: "JUAN PEREZ GARCIA",
      baseImponibleGravada: 24.15,
      igv: 4.35,
      inafecta: 0,
      exonerada: 0,
      montoTotal: 28.50,
      moneda: "PEN",
      tipoCambio: 1.0,
      estadoComprobante: "1",
      codigoSunat: "7X8A9B2C",
    },
    {
      id: "2",
      periodo: `${periodo}00`,
      cuo: "CUO-100002",
      fechaEmision: "16/08/2026",
      fechaVcto: "16/08/2026",
      tipoComprobante: "01",
      serie: "F001",
      numero: "00001204",
      tipoDocCliente: "6",
      numDocCliente: "20601234567",
      razonSocialCliente: "INVERSIONES RETAIL SAC",
      baseImponibleGravada: 122.88,
      igv: 22.12,
      inafecta: 0,
      exonerada: 0,
      montoTotal: 145.00,
      moneda: "PEN",
      tipoCambio: 1.0,
      estadoComprobante: "1",
      codigoSunat: "3F4D5E6A",
    },
  ];
}
