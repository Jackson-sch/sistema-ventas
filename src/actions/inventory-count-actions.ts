"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";

export interface InventoryCountItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  tipoVenta: "unidad" | "peso";
  stockTeorico: number;
  conteoFisico: number;
  diferencia: number; // conteoFisico - stockTeorico
  costoUnitario: number;
  impactoMonetario: number; // diferencia * costoUnitario
  lote?: string;
  fechaVencimiento?: string;
  estadoVencimiento?: "vigente" | "por_vencer" | "vencido";
}

export interface InventoryAuditSession {
  id: string;
  codigoSesion: string;
  fecha: string;
  responsable: string;
  sucursalId: string;
  sucursal: string;
  estado: "en_proceso" | "ajustado" | "cancelado";
  totalItemsContados: number;
  totalDiferencias: number;
  impactoTotalSoles: number;
  items: InventoryCountItem[];
}

export async function getActiveAuditSessionAction(): Promise<InventoryAuditSession> {
  const ctx = await getDevContext();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const [prodsRows, sucursalRows, usuarioRows, lotesRows] = await Promise.all([
        db
          .select({
            id: schema.productos.id,
            sku: schema.productos.sku,
            nombre: schema.productos.nombre,
            categoriaNombre: schema.categorias.nombre,
            tipo: schema.productos.tipo,
            precioCosto: schema.productos.precioCosto,
            stockActual: schema.inventario.stockActual,
          })
          .from(schema.productos)
          .leftJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
          .leftJoin(
            schema.inventario,
            and(
              eq(schema.inventario.productoId, schema.productos.id),
              eq(schema.inventario.sucursalId, ctx.sucursalId)
            )
          )
          .where(eq(schema.productos.estado, "activo"))
          .orderBy(schema.productos.nombre),
        db
          .select({ id: schema.sucursales.id, nombre: schema.sucursales.nombre })
          .from(schema.sucursales)
          .where(eq(schema.sucursales.id, ctx.sucursalId))
          .limit(1),
        db
          .select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre })
          .from(schema.usuarios)
          .where(eq(schema.usuarios.id, ctx.cajeroId))
          .limit(1),
        db.select().from(schema.lotes),
      ]);

      const sucursalNombre = sucursalRows[0]?.nombre || "Sucursal Principal";
      const responsableNombre = usuarioRows[0]?.nombre || "Supervisor de Inventario";

      const lotesMap = new Map<string, (typeof lotesRows)[number]>();
      for (const l of lotesRows) {
        if (!lotesMap.has(l.productoId)) {
          lotesMap.set(l.productoId, l);
        }
      }

      const today = new Date();

      const items: InventoryCountItem[] = prodsRows.map((p) => {
        const stockTeorico = p.stockActual ? parseFloat(p.stockActual) : 0;
        const conteoFisico = stockTeorico; // default initial count is theoretical stock
        const costo = p.precioCosto ? parseFloat(p.precioCosto) : 0;
        const loteInfo = lotesMap.get(p.id);

        let estadoVencimiento: "vigente" | "por_vencer" | "vencido" = "vigente";
        let fechaVencStr: string | undefined = undefined;

        if (loteInfo?.fechaVencimiento) {
          const vDate = new Date(loteInfo.fechaVencimiento);
          fechaVencStr = vDate.toISOString().split("T")[0];
          const diffDays = Math.ceil((vDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            estadoVencimiento = "vencido";
          } else if (diffDays <= 30) {
            estadoVencimiento = "por_vencer";
          }
        }

        return {
          productoId: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoria: p.categoriaNombre || "General",
          tipoVenta: p.tipo === "peso" ? "peso" : "unidad",
          stockTeorico,
          conteoFisico,
          diferencia: 0,
          costoUnitario: costo,
          impactoMonetario: 0,
          lote: loteInfo?.numeroLote || undefined,
          fechaVencimiento: fechaVencStr,
          estadoVencimiento,
        };
      });

      const todayCode = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      return {
        id: `audit-${todayCode}`,
        codigoSesion: `AUD-${todayCode}-01`,
        fecha: new Date().toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }),
        responsable: responsableNombre,
        sucursalId: ctx.sucursalId,
        sucursal: sucursalNombre,
        estado: "en_proceso",
        totalItemsContados: items.length,
        totalDiferencias: 0,
        impactoTotalSoles: 0,
        items,
      };
    }
  } catch (error) {
    console.error("getActiveAuditSessionAction: DB fallback error:", error);
  }

  // Fallback if DB is unavailable
  return {
    id: "audit-demo",
    codigoSesion: "AUD-20260821-01",
    fecha: "21/08/2026 12:00",
    responsable: "Carlos Alarcón (Supervisor)",
    sucursalId: ctx.sucursalId,
    sucursal: "Sucursal Central",
    estado: "en_proceso",
    totalItemsContados: 0,
    totalDiferencias: 0,
    impactoTotalSoles: 0,
    items: [],
  };
}

export interface ReconcileInventoryAdjustmentInput {
  codigoSesion: string;
  motivoAjuste: string;
  items: {
    productoId: string;
    sku: string;
    nombre: string;
    stockTeorico: number;
    conteoFisico: number;
    diferencia: number;
    costoUnitario: number;
  }[];
}

export async function applyKardexAdjustmentAction(
  input: ReconcileInventoryAdjustmentInput
): Promise<{ success: boolean; message: string; adjustedCount?: number }> {
  try {
    const ctx = await getDevContext();

    const itemsToAdjust = input.items.filter((it) => it.diferencia !== 0);

    if (itemsToAdjust.length === 0) {
      return {
        success: true,
        message: "No se detectaron diferencias de inventario para regularizar.",
        adjustedCount: 0,
      };
    }

    await db.transaction(async (tx) => {
      for (const item of itemsToAdjust) {
        const kardexId = crypto.randomUUID();
        const docRef = `${input.codigoSesion}`;
        const signedQty = item.diferencia; // positive means surplus, negative means missing

        // 1. Insert Kardex Asiento
        await tx.insert(schema.movimientosInventario).values({
          id: kardexId,
          tenantId: ctx.tenantId,
          sucursalId: ctx.sucursalId,
          productoId: item.productoId,
          tipo: "ajuste",
          cantidad: signedQty.toFixed(3),
          motivo: `${input.motivoAjuste} [${docRef}] (Stock Teórico: ${item.stockTeorico} -> Físico: ${item.conteoFisico})`,
          referenciaTipo: "toma_inventario",
          referenciaId: kardexId,
          usuarioId: ctx.cajeroId,
        });

        // 2. Set actual stock in inventory to the exact physical count
        await tx
          .update(schema.inventario)
          .set({
            stockActual: item.conteoFisico.toFixed(3),
            actualizadoEn: new Date(),
          })
          .where(
            and(
              eq(schema.inventario.productoId, item.productoId),
              eq(schema.inventario.sucursalId, ctx.sucursalId)
            )
          );

        // 3. Audit Log
        await tx.insert(schema.auditoriaLog).values({
          tenantId: ctx.tenantId,
          usuarioId: ctx.cajeroId,
          tablaAfectada: "inventario",
          registroId: item.productoId,
          accion: "actualizar",
          datosNuevos: {
            sesion: input.codigoSesion,
            producto: item.nombre,
            sku: item.sku,
            stockTeorico: item.stockTeorico,
            conteoFisico: item.conteoFisico,
            diferencia: item.diferencia,
            motivo: input.motivoAjuste,
          },
        });
      }
    });

    revalidatePath("/inventario");
    revalidatePath("/inventario/conteo");
    revalidatePath("/inventario/kardex");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Se regularizaron ${itemsToAdjust.length} productos en la base de datos y se generaron los asientos correspondientes en el Kardex.`,
      adjustedCount: itemsToAdjust.length,
    };
  } catch (error: any) {
    console.error("Error in applyKardexAdjustmentAction:", error);
    return {
      success: false,
      message: error.message || "Error al procesar ajuste masivo en base de datos.",
    };
  }
}
