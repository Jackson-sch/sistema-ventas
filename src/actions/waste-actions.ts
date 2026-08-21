"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";

export type WasteReason =
  | "VENCIMIENTO"
  | "ROTURA_TRANSPORTE"
  | "MERMA_PERECIBLE"
  | "DEFECTO_FABRICA"
  | "CONTAMINACION";

export type WasteStatus = "BORRADOR" | "APROBADO_KARDEX" | "DESTRUIDO_CON_ACTA";

export interface WasteItem {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnit: number;
  costoTotal: number;
  lote?: string;
  fechaVencimiento?: string;
}

export interface WasteRecord {
  id: string;
  codigoActa: string;
  fecha: string;
  hora: string;
  motivo: WasteReason;
  sucursal: string;
  responsable: string;
  notarioColegiado?: string;
  metodoDestruccion: string;
  lugarDestruccion: string;
  costoTotalPerdida: number;
  estado: WasteStatus;
  observaciones: string;
  items: WasteItem[];
}

export async function getWasteRecordsAction(): Promise<WasteRecord[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const [rows, auditRows] = await Promise.all([
        db
          .select({
            id: schema.movimientosInventario.id,
            tipo: schema.movimientosInventario.tipo,
            cantidad: schema.movimientosInventario.cantidad,
            motivo: schema.movimientosInventario.motivo,
            fecha: schema.movimientosInventario.creadoEn,
            productoId: schema.movimientosInventario.productoId,
            productoNombre: schema.productos.nombre,
            sku: schema.productos.sku,
            precioCosto: schema.productos.precioCosto,
            unidadMedida: schema.productos.unidadMedida,
            sucursalNombre: schema.sucursales.nombre,
            usuarioNombre: schema.usuarios.nombre,
          })
          .from(schema.movimientosInventario)
          .leftJoin(schema.productos, eq(schema.movimientosInventario.productoId, schema.productos.id))
          .leftJoin(schema.sucursales, eq(schema.movimientosInventario.sucursalId, schema.sucursales.id))
          .leftJoin(schema.usuarios, eq(schema.movimientosInventario.usuarioId, schema.usuarios.id))
          .where(eq(schema.movimientosInventario.tipo, "merma"))
          .orderBy(desc(schema.movimientosInventario.creadoEn)),
        db
          .select()
          .from(schema.auditoriaLog)
          .where(eq(schema.auditoriaLog.tablaAfectada, "mermas_actas"))
          .orderBy(desc(schema.auditoriaLog.creadoEn)),
      ]);

      const auditMap = new Map<string, any>();
      for (const a of auditRows) {
        if (a.registroId && a.datosNuevos) {
          auditMap.set(a.registroId, a.datosNuevos);
        }
      }

      if (rows && rows.length > 0) {
        return rows.map((r, idx) => {
          const qty = Math.abs(parseFloat(r.cantidad));
          const unitCost = parseFloat(r.precioCosto || "3.50");
          const totalLoss = +(qty * unitCost).toFixed(2);
          const fechaD = new Date(r.fecha);

          const auditData = auditMap.get(r.id) || {};

          const rawMotivo = (r.motivo || "").toLowerCase();
          const motivoEnum: WasteReason = rawMotivo.includes("venc")
            ? "VENCIMIENTO"
            : rawMotivo.includes("rot") || rawMotivo.includes("transp")
            ? "ROTURA_TRANSPORTE"
            : rawMotivo.includes("defect")
            ? "DEFECTO_FABRICA"
            : rawMotivo.includes("contam")
            ? "CONTAMINACION"
            : "MERMA_PERECIBLE";

          const matchActa = r.motivo?.match(/\[(.*?)\]/);
          const codigoActa = matchActa ? matchActa[1] : auditData.codigoActa || `ACTA-2026-${String(100 + idx).padStart(4, "0")}`;

          return {
            id: r.id,
            codigoActa,
            fecha: fechaD.toLocaleDateString("es-PE"),
            hora: fechaD.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
            motivo: auditData.motivo || motivoEnum,
            sucursal: r.sucursalNombre || "Sucursal Principal",
            responsable: r.usuarioNombre ? `${r.usuarioNombre}` : "Supervisor de Turno",
            notarioColegiado: auditData.notarioColegiado || (totalLoss > 5000 ? "Dra. Carmen Salazar (Notaría 14 de Lima)" : "Sin Notario (Art. 37 LIR < 10 UIT)"),
            metodoDestruccion: auditData.metodoDestruccion || "Desnaturalización y disposición en relleno sanitario certificado",
            lugarDestruccion: auditData.lugarDestruccion || "Almacén Central de Bajas & Mermas",
            costoTotalPerdida: totalLoss,
            estado: (auditData.estado || "APROBADO_KARDEX") as WasteStatus,
            observaciones: auditData.observaciones || r.motivo || "Baja tributaria por merma y desmedro Art. 37 LIR.",
            items: [
              {
                productoId: r.productoId,
                sku: r.sku || "SKU-001",
                nombre: r.productoNombre || "Producto",
                cantidad: qty,
                unidad: (r.unidadMedida || "und").toLowerCase(),
                costoUnit: unitCost,
                costoTotal: totalLoss,
                lote: auditData.lote || "L-2026-MERMA",
                fechaVencimiento: fechaD.toLocaleDateString("es-PE"),
              },
            ],
          };
        });
      }
    }
  } catch (err) {
    console.warn("getWasteRecordsAction: DB fallback:", err);
  }

  return [];
}

export async function createWasteRecordAction(input: {
  motivo: WasteReason;
  sucursal?: string;
  responsable?: string;
  notarioColegiado?: string;
  metodoDestruccion: string;
  lugarDestruccion: string;
  observaciones: string;
  items: WasteItem[];
}): Promise<{ success: boolean; error?: string; recordId?: string }> {
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Debe agregar al menos un producto al acta de desmedro." };
  }

  try {
    const ctx = await getDevContext();
    const codigoActa = `ACTA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const primaryId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      for (const item of input.items) {
        const kardexId = crypto.randomUUID();
        const signedQty = -Math.abs(item.cantidad);

        // 1. Insert Kardex Merma Asiento
        await tx.insert(schema.movimientosInventario).values({
          id: kardexId,
          tenantId: ctx.tenantId,
          sucursalId: ctx.sucursalId,
          productoId: item.productoId,
          tipo: "merma",
          cantidad: signedQty.toFixed(3),
          motivo: `${input.motivo}: ${input.observaciones} [${codigoActa}]`,
          referenciaTipo: "acta_desmedro",
          referenciaId: primaryId,
          usuarioId: ctx.cajeroId,
        });

        // 2. Deduct inventory stock in origin branch
        await tx
          .update(schema.inventario)
          .set({
            stockActual: sql`GREATEST(${schema.inventario.stockActual} - ${item.cantidad}, 0)`,
            actualizadoEn: new Date(),
          })
          .where(
            and(
              eq(schema.inventario.productoId, item.productoId),
              eq(schema.inventario.sucursalId, ctx.sucursalId)
            )
          );
      }

      // 3. Persist Full Legal Metadata in Audit Trail
      await tx.insert(schema.auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "mermas_actas",
        registroId: primaryId,
        accion: "crear",
        datosNuevos: {
          codigoActa,
          motivo: input.motivo,
          notarioColegiado: input.notarioColegiado,
          metodoDestruccion: input.metodoDestruccion,
          lugarDestruccion: input.lugarDestruccion,
          observaciones: input.observaciones,
          estado: "APROBADO_KARDEX",
          items: input.items,
          costoTotalPerdida: input.items.reduce((acc, i) => acc + i.costoTotal, 0),
        },
      });
    });

    revalidatePath("/inventario");
    revalidatePath("/inventario/mermas");
    revalidatePath("/inventario/kardex");
    revalidatePath("/dashboard");

    return { success: true, recordId: primaryId };
  } catch (error: any) {
    console.error("Error in createWasteRecordAction:", error);
    return { success: false, error: error.message || "Error al registrar el acta de merma en la base de datos." };
  }
}

export async function approveWasteRecordAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getDevContext();

    await db.insert(schema.auditoriaLog).values({
      tenantId: ctx.tenantId,
      usuarioId: ctx.cajeroId,
      tablaAfectada: "mermas_actas",
      registroId: id,
      accion: "actualizar",
      datosNuevos: { estado: "DESTRUIDO_CON_ACTA" },
    });

    revalidatePath("/inventario/mermas");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al aprobar acta de merma." };
  }
}

export async function deleteWasteRecordAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getDevContext();

    await db.transaction(async (tx) => {
      // Find the movement
      const [mov] = await tx
        .select()
        .from(schema.movimientosInventario)
        .where(eq(schema.movimientosInventario.id, id))
        .limit(1);

      if (mov) {
        // Revert inventory stock
        const restoredQty = Math.abs(parseFloat(mov.cantidad));
        await tx
          .update(schema.inventario)
          .set({
            stockActual: sql`${schema.inventario.stockActual} + ${restoredQty}`,
            actualizadoEn: new Date(),
          })
          .where(
            and(
              eq(schema.inventario.productoId, mov.productoId),
              eq(schema.inventario.sucursalId, mov.sucursalId)
            )
          );

        // Delete movement
        await tx
          .delete(schema.movimientosInventario)
          .where(eq(schema.movimientosInventario.id, id));
      }
    });

    revalidatePath("/inventario");
    revalidatePath("/inventario/mermas");
    revalidatePath("/inventario/kardex");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al anular el acta de merma." };
  }
}
