"use server";

import { db } from "@/db";
import {
  clientes,
  movimientosPuntos,
  programaPuntos,
  auditoriaLog,
  ventas,
  comprobantes,
  cajas,
  ventasDetalle,
} from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";

export interface UpsertClientInput {
  id?: string;
  tipoDoc: "DNI" | "RUC" | "CE";
  numDoc: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  categoria: "Estándar" | "VIP / Frecuente" | "Mayorista";
  puntos: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapTipoDoc(tipoDoc: "DNI" | "RUC" | "CE"): "dni" | "ruc" | "ce" | "pasaporte" {
  return tipoDoc === "RUC" ? "ruc" : tipoDoc === "CE" ? "ce" : "dni";
}

export async function upsertClientAction(input: UpsertClientInput) {
  try {
    const ctx = await getDevContext();
    const esNuevo = !input.id || !UUID_RE.test(input.id);
    const clientId = esNuevo ? crypto.randomUUID() : input.id!;

    await db.transaction(async (tx) => {
      if (esNuevo) {
        await tx.insert(clientes).values({
          id: clientId,
          tenantId: ctx.tenantId,
          tipoDocumento: mapTipoDoc(input.tipoDoc),
          numeroDocumento: input.numDoc,
          nombre: input.nombre,
          telefono: input.telefono || null,
          email: input.email || null,
          direccion: input.direccion || null,
        });
      } else {
        await tx
          .update(clientes)
          .set({
            tipoDocumento: mapTipoDoc(input.tipoDoc),
            numeroDocumento: input.numDoc,
            nombre: input.nombre,
            telefono: input.telefono || null,
            email: input.email || null,
            direccion: input.direccion || null,
          })
          .where(eq(clientes.id, clientId as string));
      }

      await tx
        .insert(programaPuntos)
        .values({ clienteId: clientId as string, puntosAcumulados: input.puntos })
        .onConflictDoUpdate({
          target: programaPuntos.clienteId,
          set: { puntosAcumulados: input.puntos, actualizadoEn: new Date() },
        });

      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "clientes",
        registroId: clientId as string,
        accion: (esNuevo ? "crear" : "actualizar") as "crear" | "actualizar",
        datosNuevos: { nombre: input.nombre, documento: input.numDoc },
      });
    });

    revalidatePath("/clientes");
    revalidatePath("/pos");

    return {
      success: true,
      clientId,
      nombre: input.nombre,
    };
  } catch (error: any) {
    console.error("Error upsert client:", error);
    return {
      success: false,
      error: error.message || "Error al guardar cliente",
    };
  }
}

export async function redeemPointsAction(clientId: string, puntosCanjeados: number, descuento: number) {
  try {
    const ctx = await getDevContext();
    const [cliente] = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(eq(clientes.id, clientId))
      .limit(1);

    if (!cliente) {
      throw new Error("El cliente no existe.");
    }

    const [puntos] = await db
      .select({ puntos: programaPuntos.puntosAcumulados })
      .from(programaPuntos)
      .where(eq(programaPuntos.clienteId, clientId))
      .limit(1);

    const puntosActuales = puntos?.puntos ?? 0;
    if (puntosCanjeados > puntosActuales) {
      throw new Error(`El cliente solo tiene ${puntosActuales} puntos disponibles.`);
    }

    const movimientoId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx
        .update(programaPuntos)
        .set({
          puntosAcumulados: sql`GREATEST(${programaPuntos.puntosAcumulados} - ${puntosCanjeados}, 0)`,
          actualizadoEn: new Date(),
        })
        .where(eq(programaPuntos.clienteId, clientId));

      await tx.insert(movimientosPuntos).values({
        id: movimientoId,
        clienteId: clientId,
        puntos: -puntosCanjeados,
        motivo: `Canje de puntos (descuento S/ ${descuento.toFixed(2)})`,
      });

      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "movimientos_puntos",
        registroId: movimientoId,
        accion: "crear",
        datosNuevos: { cliente: clientId, puntos: -puntosCanjeados },
      });
    });

    revalidatePath("/clientes");
    revalidatePath("/pos");

    return {
      success: true,
      movimientoId,
      descuento,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al canjear puntos",
    };
  }
}

export async function deleteClientAction(id: string, nombre: string) {
  try {
    const ctx = await getDevContext();

    await db.transaction(async (tx) => {
      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "clientes",
        registroId: id,
        accion: "eliminar",
        datosNuevos: { nombre },
      });

      await tx.delete(clientes).where(eq(clientes.id, id));
    });

    revalidatePath("/clientes");

    return {
      success: true,
      id,
    };
  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Error al eliminar cliente. Verifica que no tenga ventas asociadas.",
    };
  }
}

export interface ClientPurchaseRecord {
  id: string;
  comprobante: string;
  tipoComprobante: string;
  fecha: string;
  hora: string;
  caja: string;
  total: number;
  puntosGanados: number;
  itemsCount: number;
  estado: string;
}

export async function getClientPurchaseHistoryAction(
  clientId: string
): Promise<ClientPurchaseRecord[]> {
  try {
    if (!UUID_RE.test(clientId)) {
      return [];
    }

    const ventasRows = await db
      .select({
        id: ventas.id,
        total: ventas.total,
        estado: ventas.estado,
        creadoEn: ventas.creadoEn,
        comprobanteTipo: comprobantes.tipo,
        comprobanteSerie: comprobantes.serie,
        comprobanteNumero: comprobantes.numero,
        cajaNombre: cajas.nombre,
      })
      .from(ventas)
      .leftJoin(comprobantes, eq(comprobantes.ventaId, ventas.id))
      .leftJoin(cajas, eq(cajas.id, ventas.cajaId))
      .where(eq(ventas.clienteId, clientId))
      .orderBy(desc(ventas.creadoEn))
      .limit(30);

    if (!ventasRows || ventasRows.length === 0) {
      return [];
    }

    // Get item counts for each sale
    const ventaIds = ventasRows.map((v) => v.id);
    const detalleRows = await db
      .select({
        ventaId: ventasDetalle.ventaId,
        count: sql<number>`count(${ventasDetalle.id})`,
      })
      .from(ventasDetalle)
      .where(sql`${ventasDetalle.ventaId} in ${ventaIds}`)
      .groupBy(ventasDetalle.ventaId);

    const countMap = new Map(detalleRows.map((d) => [d.ventaId, Number(d.count)]));

    return ventasRows.map((v) => {
      const fechaObj = new Date(v.creadoEn);
      const fecha = fechaObj.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const hora = fechaObj.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const compStr = v.comprobanteSerie && v.comprobanteNumero
        ? `${v.comprobanteSerie}-${v.comprobanteNumero}`
        : `TKT-${v.id.substring(0, 8).toUpperCase()}`;

      const totalNum = parseFloat(String(v.total)) || 0;
      const puntosGanados = Math.floor(totalNum / 10);

      return {
        id: v.id,
        comprobante: compStr,
        tipoComprobante: v.comprobanteTipo || "Boleta",
        fecha,
        hora,
        caja: v.cajaNombre || "Caja Principal",
        total: totalNum,
        puntosGanados,
        itemsCount: countMap.get(v.id) || 1,
        estado: v.estado,
      };
    });
  } catch (error) {
    console.error("Error in getClientPurchaseHistoryAction:", error);
    return [];
  }
}