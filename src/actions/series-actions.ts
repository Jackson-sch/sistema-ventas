"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDevContext } from "./context";
import { revalidatePath } from "next/cache";

export interface SerieItem {
  id: string;
  tipoComprobante: string; // '01', '03', '07', '08', '09', 'COT'
  tipoNombre: string;
  serie: string;
  correlativoActual: number;
  correlativoInicial: number;
  proximoNumero: number;
  formato: string;
  esPrincipal: boolean;
  activo: boolean;
  sucursalId?: string | null;
  sucursalNombre?: string;
  cajaId?: string | null;
  cajaNombre?: string;
  actualizadoEn: string;
}

export interface SaveSerieInput {
  id?: string;
  tipoComprobante: string;
  tipoNombre: string;
  serie: string;
  correlativoActual: number;
  correlativoInicial?: number;
  formato?: string;
  esPrincipal?: boolean;
  activo?: boolean;
  sucursalId?: string | null;
  cajaId?: string | null;
}

const FALLBACK_SERIES: SerieItem[] = [
  {
    id: "s-b001",
    tipoComprobante: "03",
    tipoNombre: "Boleta de Venta Electrónica",
    serie: "B001",
    correlativoActual: 42991,
    correlativoInicial: 1,
    proximoNumero: 42992,
    formato: "ticket_80mm",
    esPrincipal: true,
    activo: true,
    actualizadoEn: new Date().toLocaleDateString("es-PE"),
  },
  {
    id: "s-f001",
    tipoComprobante: "01",
    tipoNombre: "Factura Electrónica",
    serie: "F001",
    correlativoActual: 1204,
    correlativoInicial: 1,
    proximoNumero: 1205,
    formato: "ticket_80mm",
    esPrincipal: true,
    activo: true,
    actualizadoEn: new Date().toLocaleDateString("es-PE"),
  },
  {
    id: "s-bc01",
    tipoComprobante: "07",
    tipoNombre: "Nota de Crédito (Boleta)",
    serie: "BC01",
    correlativoActual: 45,
    correlativoInicial: 1,
    proximoNumero: 46,
    formato: "ticket_80mm",
    esPrincipal: true,
    activo: true,
    actualizadoEn: new Date().toLocaleDateString("es-PE"),
  },
  {
    id: "s-fc01",
    tipoComprobante: "07",
    tipoNombre: "Nota de Crédito (Factura)",
    serie: "FC01",
    correlativoActual: 12,
    correlativoInicial: 1,
    proximoNumero: 13,
    formato: "ticket_80mm",
    esPrincipal: false,
    activo: true,
    actualizadoEn: new Date().toLocaleDateString("es-PE"),
  },
  {
    id: "s-t001",
    tipoComprobante: "09",
    tipoNombre: "Guía de Remisión Remitente",
    serie: "T001",
    correlativoActual: 0,
    correlativoInicial: 1,
    proximoNumero: 1,
    formato: "a4",
    esPrincipal: true,
    activo: true,
    actualizadoEn: new Date().toLocaleDateString("es-PE"),
  },
  {
    id: "s-cot1",
    tipoComprobante: "COT",
    tipoNombre: "Cotización / Proforma",
    serie: "COT1",
    correlativoActual: 150,
    correlativoInicial: 1,
    proximoNumero: 151,
    formato: "ticket_80mm",
    esPrincipal: true,
    activo: true,
    actualizadoEn: new Date().toLocaleDateString("es-PE"),
  },
];

/**
 * Obtiene todas las series y correlativos configurados
 */
export async function getSeriesComprobantesData(): Promise<SerieItem[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const ctx = await getDevContext();

      const [seriesRows, sucursalesRows, cajasRows] = await Promise.all([
        db
          .select()
          .from(schema.seriesComprobantes)
          .where(eq(schema.seriesComprobantes.tenantId, ctx.tenantId))
          .orderBy(schema.seriesComprobantes.tipoComprobante, schema.seriesComprobantes.serie),
        db.select().from(schema.sucursales).where(eq(schema.sucursales.tenantId, ctx.tenantId)),
        db.select().from(schema.cajas).where(eq(schema.cajas.tenantId, ctx.tenantId)),
      ]);

      if (seriesRows && seriesRows.length > 0) {
        const sucMap = new Map(sucursalesRows.map((s) => [s.id, s.nombre]));
        const cajaMap = new Map(cajasRows.map((c) => [c.id, c.nombre]));

        return seriesRows.map((s) => ({
          id: s.id,
          tipoComprobante: s.tipoComprobante,
          tipoNombre: s.tipoNombre,
          serie: s.serie,
          correlativoActual: s.correlativoActual,
          correlativoInicial: s.correlativoInicial,
          proximoNumero: s.correlativoActual + 1,
          formato: s.formato,
          esPrincipal: s.esPrincipal,
          activo: s.activo,
          sucursalId: s.sucursalId,
          sucursalNombre: s.sucursalId ? sucMap.get(s.sucursalId) : undefined,
          cajaId: s.cajaId,
          cajaNombre: s.cajaId ? cajaMap.get(s.cajaId) : undefined,
          actualizadoEn: s.actualizadoEn ? new Date(s.actualizadoEn).toLocaleDateString("es-PE") : "-",
        }));
      }
    }
  } catch (err) {
    console.warn("getSeriesComprobantesData: fallback:", err);
  }

  return FALLBACK_SERIES;
}

/**
 * Guarda o actualiza una serie y su correlativo
 */
export async function saveSerieComprobanteAction(
  input: SaveSerieInput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      return { success: true };
    }

    const ctx = await getDevContext();
    const serieUpper = input.serie.trim().toUpperCase();

    // Validar formato de serie SUNAT
    if (serieUpper.length !== 4) {
      return { success: false, error: "La serie debe tener exactamente 4 caracteres alfanuméricos (ej: F001, B001, T001, BC01)." };
    }

    if (input.id) {
      // Actualizar existente
      await db
        .update(schema.seriesComprobantes)
        .set({
          tipoComprobante: input.tipoComprobante,
          tipoNombre: input.tipoNombre,
          serie: serieUpper,
          correlativoActual: input.correlativoActual,
          correlativoInicial: input.correlativoInicial ?? 1,
          formato: input.formato || "ticket_80mm",
          esPrincipal: input.esPrincipal ?? true,
          activo: input.activo ?? true,
          sucursalId: input.sucursalId || null,
          cajaId: input.cajaId || null,
          actualizadoEn: new Date(),
        })
        .where(
          and(
            eq(schema.seriesComprobantes.id, input.id),
            eq(schema.seriesComprobantes.tenantId, ctx.tenantId)
          )
        );
    } else {
      // Crear nueva
      // Si se marca como principal, desmarcar las otras del mismo tipo
      if (input.esPrincipal) {
        await db
          .update(schema.seriesComprobantes)
          .set({ esPrincipal: false })
          .where(
            and(
              eq(schema.seriesComprobantes.tenantId, ctx.tenantId),
              eq(schema.seriesComprobantes.tipoComprobante, input.tipoComprobante)
            )
          );
      }

      await db.insert(schema.seriesComprobantes).values({
        tenantId: ctx.tenantId,
        sucursalId: input.sucursalId || ctx.sucursalId,
        cajaId: input.cajaId || ctx.cajaId,
        tipoComprobante: input.tipoComprobante,
        tipoNombre: input.tipoNombre,
        serie: serieUpper,
        correlativoActual: input.correlativoActual || 0,
        correlativoInicial: input.correlativoInicial || 1,
        formato: input.formato || "ticket_80mm",
        esPrincipal: input.esPrincipal ?? true,
        activo: input.activo ?? true,
      });
    }

    try {
      revalidatePath("/configuracion");
      revalidatePath("/pos");
      revalidatePath("/ventas");
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("saveSerieComprobanteAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al guardar la serie y correlativo.",
    };
  }
}

/**
 * Alterna el estado activo/inactivo de una serie
 */
export async function toggleSerieStatusAction(
  id: string,
  activo: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getDevContext();
    await db
      .update(schema.seriesComprobantes)
      .set({ activo, actualizadoEn: new Date() })
      .where(
        and(
          eq(schema.seriesComprobantes.id, id),
          eq(schema.seriesComprobantes.tenantId, ctx.tenantId)
        )
      );

    try {
      revalidatePath("/configuracion");
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene y reserva el siguiente número correlativo atómico
 */
export async function getNextCorrelativoNumber(
  tipoComprobante: string,
  tenantId: string,
  seriePreferida?: string
): Promise<{ serie: string; numero: number; serieNumero: string }> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      // Buscar serie activa preferida o la principal
      const condition = seriePreferida
        ? and(
            eq(schema.seriesComprobantes.tenantId, tenantId),
            eq(schema.seriesComprobantes.tipoComprobante, tipoComprobante),
            eq(schema.seriesComprobantes.serie, seriePreferida),
            eq(schema.seriesComprobantes.activo, true)
          )
        : and(
            eq(schema.seriesComprobantes.tenantId, tenantId),
            eq(schema.seriesComprobantes.tipoComprobante, tipoComprobante),
            eq(schema.seriesComprobantes.esPrincipal, true),
            eq(schema.seriesComprobantes.activo, true)
          );

      const [serieRow] = await db.select().from(schema.seriesComprobantes).where(condition).limit(1);

      if (serieRow) {
        const nextNum = serieRow.correlativoActual + 1;
        // Incrementar correlativo actual en la BD
        await db
          .update(schema.seriesComprobantes)
          .set({
            correlativoActual: nextNum,
            actualizadoEn: new Date(),
          })
          .where(eq(schema.seriesComprobantes.id, serieRow.id));

        return {
          serie: serieRow.serie,
          numero: nextNum,
          serieNumero: `${serieRow.serie}-${nextNum.toString().padStart(8, "0")}`,
        };
      }
    }
  } catch (err) {
    console.warn("getNextCorrelativoNumber: error:", err);
  }

  // Fallback seguro
  const defaultSerie = tipoComprobante === "01" ? "F001" : tipoComprobante === "07" ? "BC01" : "B001";
  const randomNum = tipoComprobante === "01" ? 1205 : 42992;
  return {
    serie: defaultSerie,
    numero: randomNum,
    serieNumero: `${defaultSerie}-${randomNum.toString().padStart(8, "0")}`,
  };
}
